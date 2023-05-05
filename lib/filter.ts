import type { Operation, Stream } from "./types.ts";

export interface Predicate<A> {
  (a: A): Operation<boolean>;
}

export function filter<A>(predicate: Predicate<A>) {
  return function <TClose>(stream: Stream<A, TClose>): Stream<A, TClose> {
    return {
      *[Symbol.iterator]() {
        let subscription = yield* stream;

        return {
          *next() {
            while (true) {
              let next = yield* subscription.next();

              if (next.done) {
                return next;
              } else if (yield* predicate(next.value)) {
                return next;
              }
            }
          },
        };
      },
    };
  };
}
