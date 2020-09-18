import { PromiseController } from './controller/promise-controller';
import { IteratorController } from './controller/iterator-controller';
import { Controller } from './controller/controller';
import { Operation } from './operation';
import { Deferred } from './deferred';
import { swallowHalt, isHaltError } from './halt-error';

function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

type TaskState = 'running' | 'halting' | 'halted' | 'erroring' | 'errored' | 'completing' | 'completed';

export class Task<TOut> implements PromiseLike<TOut> {
  private children: Set<Task<unknown>> = new Set();
  private signal: Deferred<never> = Deferred();

  private controller: Controller<TOut>;
  private promise: Promise<TOut>;
  private parent?: Task<unknown>;

  public state: TaskState = 'running';

  constructor(private operation: Operation<TOut>) {
    if(!operation) {
      this.controller = new PromiseController(new Promise(() => {}));
    } else if(isPromise(operation)) {
      this.controller = new PromiseController(operation);
    } else if(isGenerator(operation)) {
      this.controller = new IteratorController(operation);
    } else if(typeof(operation) === 'function') {
      this.controller = new IteratorController(operation(this));
    } else {
      throw new Error(`unkown type of operation: ${operation}`);
    }
    this.promise = this.run();
  }

  private async haltChildren(silent = false) {
    await Promise.all(Array.from(this.children).map(async (c) => {
      try {
        await c.halt();
      } catch(error) {
        if(!silent) {
          throw error;
        }
      }
    }));
  }

  private async run(): Promise<TOut> {
    try {
      let result = await Promise.race([this.signal.promise, this.controller]);
      this.state = 'completing';
      await this.haltChildren();
      this.state = 'completed';
      return result;
    } catch(error) {
      if(isHaltError(error)) {
        this.state = 'halting';
        try {
          await this.haltChildren();
          this.state = 'halted';
          this.parent && this.parent.trapHalt(this as Task<unknown>);
        } catch(error) {
          this.state = 'errored';
          this.parent && this.parent.trapError(this as Task<unknown>, error);
          throw(error);
        }
        throw(error);
      } else {
        this.state = 'erroring';
        await this.haltChildren(true);
        this.state = 'errored';
        this.parent && this.parent.trapError(this as Task<unknown>, error);
        throw(error);
      }
    }
  }

  async halt() {
    await this.controller.halt();
    await this.then(() => {}, swallowHalt);
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  spawn<R>(operation?: Operation<R>): Task<R> {
    if(this.state !== 'running') {
      throw new Error('cannot spawn a child on a task which is not running');
    }
    let child = new Task(operation);
    child.link(this as Task<unknown>);
    return child;
  }

  link(parent: Task<unknown>) {
    this.parent = parent;
    parent.children.add(this as Task<unknown>);
  }

  trapError(child: Task<unknown>, error: Error) {
    this.signal.reject(error);
    this.children.delete(child);
  }

  trapHalt(child: Task<unknown>) {
    this.children.delete(child);
  }
}
