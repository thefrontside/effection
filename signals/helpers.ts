import type { Operation } from "effection";
import type { ValueSignal } from "./types.ts";

/**
 * Returns an operation that will wait until the value of the stream matches the predicate.
 *
 * The subscription is established before the current value is checked, so a
 * matching change that lands between observing the initial state and consuming
 * the stream is not lost. The producer does not need to yield or sleep before
 * publishing.
 *
 * @param stream - The stream to check.
 * @param predicate - The predicate to check the value against.
 * @returns An operation that will wait until the value of the stream matches the predicate.
 */
export function is<T>(
  stream: ValueSignal<T>,
  predicate: (item: T) => boolean,
): Operation<void> {
  return {
    *[Symbol.iterator]() {
      const subscription = yield* stream;
      if (predicate(stream.valueOf())) {
        return;
      }
      let next = yield* subscription.next();
      while (!next.done) {
        if (predicate(next.value)) {
          return;
        }
        next = yield* subscription.next();
      }
    },
  };
}
