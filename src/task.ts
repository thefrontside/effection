import { PromiseController } from './controller/promise-controller';
import { IteratorController } from './controller/iterator-controller';
import { Controller } from './controller/controller';
import { Operation } from './operation';

function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

function controllerOf<TOut>(operation: Operation<TOut>): Controller<TOut> {
  if(isPromise(operation)) {
    return new PromiseController(operation);
  } else if(typeof(operation) === 'function') {
    return new IteratorController(operation());
  } else {
    throw new Error(`unkown type of operation: ${operation}`);
  }
}


export class Task<TOut> implements PromiseLike<TOut> {
  private controller: Controller<TOut>;

  constructor(private operation: Operation<TOut>) {
    this.controller = controllerOf(operation);
  }

  async halt() {
    await this.controller.halt();
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.controller.then(onfulfilled, onrejected);
  }
}
