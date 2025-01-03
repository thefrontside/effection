import type { Operation } from "./types.ts";

/**
 * Create an {@link Operation} that always evaluates to `value`.
 *
 * @example
 *
 * ```ts
 * let x = yield* constant("hello world");
 * x === "hello world" //=> true
 * ```
 *
 * @returns the {@link Operation} that evaluates to `value`;
 */
export function constant<T>(value: T): Operation<T> {
  return {
    [Symbol.iterator]: () => ({ next: () => ({ done: true, value }) }),
  };
}
