import { action } from "./action.ts";
import { type Operation } from "./types.ts";

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
 *
 * @returns a function returning an operation that invokes `fn` when evaluated
 */
export function lift<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => Operation<TReturn> {
  return (...args: TArgs) => {
    return action((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (error) {
        reject(error);
      }
      return () => {};
    });
  };
}
