import type { Operation, Stream } from "./types.ts";

export interface Predicate<A> {
  (a: A): Operation<boolean>;
}

export function filter<A>(predicate: Predicate<A>) {
  return function <TClose>(stream: Stream<A, TClose>): Stream<A, TClose> {
    return {
      subscribe() {
        return {
          *[Symbol.iterator]() {
            let subscription = yield* stream.subscribe();

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
      },
    };
  };
}
