import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * Convert a simple function into an {@link Operation}
 *
 * @example
 * ```javascript
 * let log = lift((message) => console.log(message));
 *
 * export function* run() {
 *   yield* log("hello world");
 *   yield* log("done");
 * }
 * ```
 * @param fn - the function to convert into an operation.
 * @typeParam TArgs - the type of the arguments to `fn`
 * @typeParam TReturn - return type of `fn`
 * @returns a function returning an operation that invokes `fn` when evaluated
 * @since 3.0
 */
export function lift<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => Operation<TReturn> {
  return (...args: TArgs) => {
    return action((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (error) {
        reject(error as Error);
      }
      return () => {};
    });
  };
}
