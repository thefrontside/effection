import { constant } from "./constant.ts";
import { action } from "./action.ts";
import { Operation } from "./types.ts";

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
 * ```javascript
 * function hello(to: Callable<string>): Operation<string> {
 *   return function*() {
 *     return `hello ${yield* call(to)}`;
 *   }
 * }
 *
 * await run(() => hello(() => "world!")); // => "hello world!"
 * await run(() => hello(async () => "world!")); // => "hello world!"
 * await run(() => hello(function*() { return "world!" })); "hello world!";
 * ```
 */
export interface Callable<
  T extends Operation<unknown> | Promise<unknown> | unknown,
  TArgs extends unknown[] = [],
> {
  (...args: TArgs): T;
}

/**
 * Pause the current operation, async function, plain function, or operation function.
 * The calling operation will be resumed (or errored) once call is completed.
 *
 * `call()` is a uniform integration point for calling async functions,
 * generator functions, and plain functions.
 *
 * To call an async function:
 *
 * @example
 * ```typescript
 * async function* googleSlowly() {
 *   return yield* call(async function() {
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
 * @param callable the operation, promise, async function, generator funnction,
 * or plain function to call as part of this operation
 */

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
      } else if (isPromise<T>(target)) {
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
1;

function isPromise<T>(
  target: Operation<T> | Promise<T> | T,
): target is Promise<T> {
  return target && typeof (target as Promise<T>).then === "function";
}

function isOperation<T>(
  target: Operation<T> | Promise<T> | T,
): target is Operation<T> {
  return target &&
    typeof (target as Operation<T>)[Symbol.iterator] === "function";
}
