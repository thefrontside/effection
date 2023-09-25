import { type Computation, type Continuation, shift } from "./deps.ts";

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
