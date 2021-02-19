import { PromiseController } from './controller/promise-controller';
import { FunctionContoller } from './controller/function-controller';
import { Controller } from './controller/controller';
import { Operation } from './operation';
import { Deferred } from './deferred';
import { isPromise } from './predicates';
import { swallowHalt, isHaltError } from './halt-error';
import { EventEmitter } from 'events';

type TaskState = 'running' | 'halting' | 'halted' | 'erroring' | 'errored' | 'completing' | 'completed';

let COUNTER = 0;

export class Task<TOut = unknown> extends EventEmitter implements Promise<TOut> {
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
    super();
    if(!operation) {
      this.controller = new PromiseController(new Promise(() => {}));
    } else if(isPromise(operation)) {
      this.controller = new PromiseController(operation);
    } else if(typeof(operation) === 'function') {
      this.controller = new FunctionContoller(operation);
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
      this.setState('completing');
      await this.haltChildren();
      this.setState('completed');
      return result;
    } catch(error) {
      if(isHaltError(error)) {
        this.setState('halting');
        try {
          await this.haltChildren();
          this.setState('halted');
        } catch(error) {
          this.error = error;
          this.setState('errored');
          throw(error);
        }
        throw(error);
      } else {
        this.setState('erroring');
        this.error = error;
        await this.haltChildren(true);
        this.setState('errored');
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
    this.emit('link', child);
  }

  unlink(child: Task) {
    child.parent = undefined;
    this.children.delete(child);
    this.emit('unlink', child);
  }

  trapExit(child: Task) {
    if(child.state === 'errored' && child.error) {
      this.signal.reject(child.error);
    }
    this.unlink(child);
  }

  setState(state: TaskState) {
    let from = this.state;
    this.state = state;
    this.emit('state', { from, to: state });
  }

  get [Symbol.toStringTag](): string {
    return `[Task ${this.id}]`
  }
}
