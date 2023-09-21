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

export function* createQueue<T>(): Computation<Queue<T>> {
  let buffer: T[] = [];
  let consume: Resolve<T> | void = void 0;

  let unshift: Resolve<T>;
  yield* reset<Resolve<T>>(function*() {
    while (true) {
      let item = yield* shift<T>(function*(k) {
        unshift = k.tail;
      });
      buffer.unshift(item);
      if (consume) {
        consume(buffer.pop() as T);
      }
    }
  });

  return {
    add: (item) => unshift(item),
    *next() {
      let top = buffer.pop();
      if (top) {
        return top;
      } else {
        let item = yield* shift<T>(function*(k) {
          consume = k.tail;
        });
        consume = void(0);
        return item;
      }
    }
  };
}
