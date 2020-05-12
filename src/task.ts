import { PromiseController } from './controller/promise-controller';
import { IteratorController } from './controller/iterator-controller';
import { Controller } from './controller/controller';
import { Operation } from './operation';

function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export class Task<TOut> implements PromiseLike<TOut> {
  private controller: Controller<TOut>;
  private children: Set<Task<unknown>> = new Set();
  private promise: Promise<TOut>;

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

  private async haltChildren() {
    await Promise.all(Array.from(this.children).map((c) => c.halt()));
  }

  private async run(): Promise<TOut> {
    let result = await this.controller;

    await this.haltChildren();

    return result;
  }

  async halt() {
    await this.haltChildren();
    await this.controller.halt();
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  spawn<R>(operation?: Operation<R>): Task<R> {
    let child = new Task(operation);
    this.children.add(child);
    return child;
  }
}
