import { PromiseController } from './controller/promise-controller';
import { FunctionContoller } from './controller/function-controller';
import { Controller } from './controller/controller';
import { Operation } from './operation';
import { Deferred } from './deferred';
import { isPromise } from './predicates';
import { Trapper } from './trapper';
import { swallowHalt, isHaltError } from './halt-error';
import { EventEmitter } from 'events';
import { StateMachine, State } from './state-machine';
import { HaltError } from './halt-error';

let COUNTER = 0;

export interface Controls<TOut> {
  resume(): void;
  resolve(value: TOut): void;
  reject(error: Error): void;
}

export class Task<TOut = unknown> extends EventEmitter implements Controls<TOut>, Promise<TOut>, Trapper {
  public id = ++COUNTER;

  private children: Set<Task> = new Set();
  private signal: Deferred<never> = Deferred();

  private controller: Controller<TOut>;
  private deferred = Deferred<TOut>();
  public parent?: Trapper;

  private stateMachine = new StateMachine(this);

  public result?: TOut;
  public error?: Error;

  get state(): State {
    return this.stateMachine.current;
  }

  constructor(private operation: Operation<TOut>) {
    super();
    if(!operation) {
      this.controller = new PromiseController(this, new Promise(() => {}));
    } else if(isPromise(operation)) {
      this.controller = new PromiseController(this, operation);
    } else if(typeof(operation) === 'function') {
      this.controller = new FunctionContoller(this, this, operation);
    } else {
      throw new Error(`unkown type of operation: ${operation}`);
    }
  }

  start() {
    this.stateMachine.start();
    this.controller.start();
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
    return this.deferred.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TOut | TResult> {
    return this.deferred.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<TOut> {
    return this.deferred.promise.finally(onfinally);
  }

  spawn<R>(operation?: Operation<R>): Task<R> {
    if(this.state !== 'running') {
      throw new Error('cannot spawn a child on a task which is not running');
    }
    let child = new Task(operation);
    this.link(child as Task);
    child.start();
    return child;
  }

  link(child: Task) {
    child.parent = this as Task;
    this.children.add(child);
    this.emit('link', child);
  }

  unlink(child: Task) {
    if(this.children.has(child)) {
      child.parent = undefined;
      this.children.delete(child);
      this.emit('unlink', child);
    }
  }

  trap(child: Task) {
    if(this.children.has(child)) {
      if(child.state === 'errored') {
        this.reject(child.error!);
      }
      this.unlink(child);
    }
    this.resume();
  }

  resolve(result: TOut) {
    this.result = result;
    this.stateMachine.resolve();
    this.children.forEach((c) => c.halt());
    this.resume();
  }

  reject(error: Error) {
    this.result = undefined; // clear result if it has previously been set
    this.error = error;
    this.stateMachine.reject();
    this.children.forEach((c) => c.halt());
    this.resume();
  }


  resume() {
    if(this.stateMachine.isFinishing && this.children.size === 0) {
      this.stateMachine.finish();

      if(this.parent) {
        this.parent.trap(this as Task);
      }

      if(this.state === 'completed') {
        this.deferred.resolve(this.result!);
      } else if(this.state === 'halted') {
        this.deferred.reject(new HaltError());
      } else if(this.state === 'errored') {
        this.deferred.reject(this.error!);
      }
    }
  }

  async halt() {
    this.stateMachine.halt();
    this.controller.halt();
    this.children.forEach((c) => c.halt());
    await this.catch(swallowHalt);
  }

  get [Symbol.toStringTag](): string {
    return `[Task ${this.id}]`
  }
}
