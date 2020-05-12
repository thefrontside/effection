import { Controller } from './controller';
import { HaltError, swallowHalt } from '../halt-error';

export class PromiseController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private _reject?: (error: Error) => void;

  constructor(promise: PromiseLike<TOut>) {
    this.promise = new Promise((resolve, reject) => {
      this._reject = reject;
      promise.then(resolve, reject);
    });
  }

  async halt() {
    this._reject && this._reject(new HaltError());

    await this.promise.catch(swallowHalt);
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
