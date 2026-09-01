import { constant } from "./constant.ts";
import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * A uniform integration type representing anything that can be evaluated
 * as a the parameter to {@link call}.
 *
 * {@link call} converts a `Callable` into an `Operation` which can then be used
 * anywhere within Effection.
 *
 * APIs that accept `Callable` values allow end developers to pass simple
 * functions without necessarily needing to know anything about Operations.
 *
 * @example
 * ```javascript
 * function hello(to: Callable<string>): Operation<string> {
 *   return function*() {
 *     return `hello ${yield* call(to)}`;
 *   }
 * }
 *
 * await run(() => hello(() => "world!")); // => "hello world!"
 * await run(() => hello(async () => "world!")); // => "hello world!"
 * await run(() => hello(function*() { return "world!" })); // => "hello world!"
 * ```
 * @since 3.0
 */
export interface Callable<
  T extends Operation<unknown> | PromiseLike<unknown> | unknown,
  TArgs extends unknown[] = [],
> {
  (...args: TArgs): T;
}

/**
 * Pause the current operation and evaluate an async function, plain
 * function, or operation function. The calling operation will be
 * resumed (or errored) once call is completed.
 *
 * `call()` is a uniform integration point for calling async functions,
 * generator functions, and plain functions.
 *
 * To call an async function:
 *
 * @example
 * ```typescript
 * export function googleSlowly(query: string) {
 *    return call(async function() {
 *     await new Promise(resolve => setTimeout(resolve, 2000));
 *     return await fetch("https://google.com");
 *   });
 * }
 * ```
 *
 * or a plain function:
 *
 * @example
 * ```javascript
 * yield* call(() => "a string");
 * ```
 *
 * The function will be invoked anew every time that the `call()` operation is evaluated.
 *
 * @param callable - the operation, promise, async function, generator function,
 * or plain function to call as part of this operation
 *
 * @returns an {@link Operation} that evaluates to the result of executing the function to completion
 * @since 3.0
 */
export function call<T, TArgs extends unknown[] = []>(
  fn: (...args: TArgs) => PromiseLike<T>,
): Operation<T>;
export function call<T, TArgs extends unknown[] = []>(
  fn: (...args: TArgs) => Operation<T>,
): Operation<T>;
export function call<T, TArgs extends unknown[] = []>(
  fn: (...args: TArgs) => T,
): Operation<T>;

export function call<T, TArgs extends unknown[] = []>(
  callable: Callable<T, TArgs>,
  ...args: TArgs
): Operation<T> {
  return {
    [Symbol.iterator]() {
      let target = callable.call(void (0), ...args);
      if (
        typeof target === "string" || Array.isArray(target) ||
        target instanceof Map || target instanceof Set
      ) {
        return constant(target)[Symbol.iterator]();
      } else if (isPromiseLike<T>(target)) {
        return action<T>(function wait(resolve, reject) {
          target.then(resolve, reject);
          return () => {};
        }, `async call ${callable.name}()`)[Symbol.iterator]();
      } else if (isOperation<T>(target)) {
        return target[Symbol.iterator]();
      } else {
        return constant(target)[Symbol.iterator]();
      }
    },
  };
}

function isPromiseLike<T>(
  target: Operation<T> | PromiseLike<T> | T,
): target is PromiseLike<T> {
  return target && typeof (target as PromiseLike<T>).then === "function";
}

function isOperation<T>(
  target: Operation<T> | PromiseLike<T> | T,
): target is Operation<T> {
  return target &&
    typeof (target as Operation<T>)[Symbol.iterator] === "function";
}
