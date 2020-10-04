export interface Controller<TOut> extends Promise<TOut> {
  halt(): void;
}
