import type { Operation } from "./types.ts";

export function constant<T>(value: T): Operation<T> {
  return {
    [Symbol.iterator]: () => ({ next: () => ({ done: true, value }) }),
  };
}
