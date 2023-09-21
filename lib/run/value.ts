import { type Computation, shift, reset } from "../deps.ts";
import { type Resolve } from "../types.ts";

export function* createValue<T>(): Computation<[Resolve<T>, Computation<T>]> {
  let result: { value: T } | void = void 0;
  let listeners = new Set<Resolve<T>>();

  let resolve = yield* reset<Resolve<T>>(function*() {
    let value = yield* shift<T>(function*(k) {
      return k.tail;
    });

    result = { value };

    for (let listener of listeners) {
      listeners.delete(listener);
      listener(value);
    }
  });

  let event = {
    *[Symbol.iterator]() {
      if (result) {
        return result.value;
      } else {
        return yield* shift<T>(function*(k) {
          listeners.add(k.tail);
        })
      }
    },
  };

  return [resolve, event];
}

export interface Queue<T> {
  add(item: T): void;
  next(): Computation<T>;
}
