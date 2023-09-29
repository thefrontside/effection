import { type Computation, type Continuation, shift } from "./deps.ts";

/**
 * Create a shift computation where the body of the shift can be resolved
 * in a single step.
 *
 * before:
 * ```ts
 * yield* shift(function*(k) { return k; });
 * ```
 * after:
 * yield* shiftSync(k => k);
 */
export function shiftSync<T>(
  block: (resolve: Continuation<T>, reject: Continuation<Error>) => void,
): Computation<T> {
  return shift<T>((resolve, reject) => {
    return {
      [Symbol.iterator]: () => ({
        next() {
          let value = block(resolve, reject);
          return { done: true, value };
        },
      }),
    };
  });
}
