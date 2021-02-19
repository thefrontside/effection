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

let COUNTER = 0;

export class Task<TOut = unknown> implements Promise<TOut> {
  public id = ++COUNTER;

  private children: Set<Task> = new Set();
  private signal: Deferred<never> = Deferred();

  private controller: Controller<TOut>;
  private promise: Promise<TOut>;
  private parent?: Task;

  public state: TaskState = 'running';

  public result?: TOut;
  public error?: Error;

  constructor(private operation: Operation<TOut>) {
    if(!operation) {
      this.controller = new PromiseController(new Promise(() => {}));
    } else if(isPromise(operation)) {
      this.controller = new PromiseController(operation);
    } else if(typeof(operation) === 'function') {
      this.controller = new IteratorController(operation);
    } else {
      throw new Error(`unkown type of operation: ${operation}`);
    }
    this.promise = this.run();
    this.controller.start(this);
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
      this.result = result;
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
        } catch(error) {
          this.error = error;
          this.state = 'errored';
          throw(error);
        }
        throw(error);
      } else {
        this.state = 'erroring';
        this.error = error;
        await this.haltChildren(true);
        this.state = 'errored';
        throw(error);
      }
    } finally {
      if(this.parent) {
        this.parent.trapExit(this as Task);
      }
    }
  }

  async halt() {
    await this.controller.halt();
    await this.then(() => {}, swallowHalt);
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TOut | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<TOut> {
    return this.promise.finally(onfinally);
  }

  spawn<R>(operation?: Operation<R>): Task<R> {
    if(this.state !== 'running') {
      throw new Error('cannot spawn a child on a task which is not running');
    }
    let child = new Task(operation);
    this.link(child as Task);
    return child;
  }

  link(child: Task) {
    child.parent = this as Task;
    this.children.add(child);
  }

  unlink(child: Task) {
    child.parent = undefined;
    this.children.delete(child);
  }

  trapExit(child: Task) {
    if(child.state === 'completed') {
      this.trapComplete(child);
    }
    if(child.state === 'errored') {
      this.trapError(child);
    }
    if(child.state === 'halted') {
      this.trapHalt(child);
    }
  }

  trapComplete(child: Task) {
    this.unlink(child);
  }

  trapError(child: Task) {
    if(child.error) {
      this.signal.reject(child.error);
    }
    this.unlink(child);
  }

  trapHalt(child: Task) {
    this.unlink(child);
  }

  get [Symbol.toStringTag](): string {
    return `[Task ${this.id}]`
  }
}
