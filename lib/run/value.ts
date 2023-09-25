import { type Computation, reset } from "../deps.ts";
import { type Resolve } from "../types.ts";
import { shiftSync } from "../shift-sync.ts";

export function* createValue<T>(): Computation<[Resolve<T>, Computation<T>]> {
  let result: { value: T } | void = void 0;
  let listeners = new Set<Resolve<T>>();

  let resolve = yield* reset<Resolve<T>>(function* () {
    let value = yield* shiftSync<T>((k) => k.tail);

    result = { value };

    for (let listener of listeners) {
      listeners.delete(listener);
      listener(value);
    }
  });

  let event: Computation<T> = {
    [Symbol.iterator]() {
      if (result) {
        return sync(result.value);
      } else {
        return shiftSync<T>((k) => {
          listeners.add(k.tail);
        })[Symbol.iterator]();
      }
    },
  };
  return [resolve, event];
}

export interface Queue<T> {
  add(item: T): void;
  next(): Computation<T>;
}

export function sync<T>(value: T) {
  return {
    next() {
      return { done: true, value } as const;
    },
  };
}
