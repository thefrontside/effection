export interface Controller<TOut> extends PromiseLike<TOut> {
  halt(): void;
}
