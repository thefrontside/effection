export type Operation<TOut> = PromiseLike<TOut> | (() => Iterator<Operation<unknown>, TOut, any>)
