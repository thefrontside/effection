import type { Operation, Stream } from "./types.ts";

export function map<A, B>(op: (a: A) => Operation<B>) {
  return function <TClose>(stream: Stream<A, TClose>): Stream<B, TClose> {
    return {
      *[Symbol.iterator]() {
        let subscription = yield* stream;

        return {
          *next() {
            let next = yield* subscription.next();

            if (next.done) {
              return next;
            } else {
              return { ...next, value: yield* op(next.value) };
            }
          },
        };
      },
    };
  };
}
