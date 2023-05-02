import { type Operation } from "./types.ts";

type AnyFunction<Args extends unknown[], R> = (...args: Args) => R;

export type OperationFunction<Args extends unknown[], R> = (
  ...args: Args
) => Operation<R>;

export function isOperation<Args extends unknown[], R>(
  fn: AnyFunction<Args, R> | OperationFunction<Args, R>,
): fn is OperationFunction<Args, R> {
  // deno-lint-ignore no-prototype-builtins
  return fn.hasOwnProperty("prototype") && "next" in fn.prototype &&
    "return" in fn.prototype && "throw" in fn.prototype;
}

export function op<Args extends unknown[], R>(
  fn: AnyFunction<Args, R>,
): OperationFunction<Args, R> {
  return (...args: Args) => {
    let value = fn(...args);
    let next = () => ({ done: true, value } as const);
    return ({
      [Symbol.iterator]: () => ({ next }),
    });
  };
}
