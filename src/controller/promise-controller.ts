import { Controller } from './controller';
import { HaltError, swallowHalt } from '../halt-error';
import { Deferred } from '../deferred';

export class PromiseController<TOut> implements Controller<TOut> {
  private deferred: Deferred<TOut>;

  constructor(promise: PromiseLike<TOut>) {
    this.deferred = Deferred();
    promise.then(this.deferred.resolve, this.deferred.reject);
  }

  async halt() {
    this.deferred.reject(new HaltError());

    await this.deferred.promise.catch(swallowHalt);
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

  get [Symbol.toStringTag](): string {
    return '[PromiseController]'
  }
}
