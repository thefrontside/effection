import { Controller } from './controller';

export class PromiseController<TOut> implements Controller<TOut> {
  constructor(private promise: PromiseLike<TOut>) {
  }

  halt() {}

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
