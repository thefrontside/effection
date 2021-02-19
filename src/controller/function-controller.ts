import { Controller } from './controller';
import { OperationFunction } from '../operation';
import { Task } from '../task';
import { HaltError } from '../halt-error';
import { Deferred } from '../deferred';
import { isPromise } from '../predicates';
import { IteratorController } from './iterator-controller';
import { PromiseController } from './promise-controller';

const HALT = Symbol("halt");

export class FunctionContoller<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltSignal: Deferred<typeof HALT> = Deferred();
  private startSignal: Deferred<{ controller: Controller<TOut> }> = Deferred();

  constructor(private operation: OperationFunction<TOut>) {
    this.promise = this.run();
  }

  start(task: Task<TOut>) {
    try {
      let controller: Controller<TOut>;
      let result = this.operation(task);
      if(isPromise(result)) {
        controller = new PromiseController(result);
      } else {
        controller = new IteratorController(result);
      }
      controller.start(task);
      this.startSignal.resolve({ controller });
    } catch(e) {
      this.startSignal.reject(e);
    }
  }

  private async run(): Promise<TOut> {
    let { controller } = await this.startSignal.promise;

    let result = await Promise.race([controller, this.haltSignal.promise]);

    if(result === HALT) {
      await controller.halt();
      throw new HaltError()
    } else {
      return result;
    }
  }

  async halt() {
    this.haltSignal.resolve(HALT);
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

  get [Symbol.toStringTag](): string {
    return '[FunctionContoller]'
  }
}
