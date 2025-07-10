import { lazyPromiseWithResolvers } from "./lazy-promise.ts";
import type { Future } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";

export interface FutureWithResolvers<T> {
  future: Future<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}
export function createFuture<T>(): FutureWithResolvers<T> {
  let promise = lazyPromiseWithResolvers<T>();
  let operation = withResolvers<T>();

  let resolve = (value: T) => {
    promise.resolve(value);
    operation.resolve(value);
  };

  let reject = (error: Error) => {
    promise.reject(error);
    operation.reject(error);
  };

  let future = Object.defineProperties(promise.promise, {
    [Symbol.iterator]: {
      enumerable: false,
      value: operation.operation[Symbol.iterator],
    },
    [Symbol.toStringTag]: {
      enumerable: false,
      configurable: true,
      value: "Future",
    },
  }) as Future<T>;

  return { future, resolve, reject };
}
