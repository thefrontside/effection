import { type Operation } from "./types.ts";

/**
 * Convert a simple function into an {@link Operation}
 *
 * @example
 * ```js
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
  fn: Fn<TArgs, TReturn>,
): LiftedFn<TArgs, TReturn> {
  return (...args: TArgs) => {
    return ({
      [Symbol.iterator]() {
        let value = fn(...args);
        return { next: () => ({ done: true, value }) };
      },
    });
  };
}

type Fn<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

type LiftedFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => Operation<TReturn>;
