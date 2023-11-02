import type { Operation, Stream, Subscription } from "./types.ts";

import { action } from "./instructions.ts";
import { call } from "./call.ts";

/**
 * @deprecated use {@link call} instead
 */
export function expect<T>(promise: Promise<T>): Operation<T> {
  return action(function* (resolve, reject) {
    promise.then(resolve, reject);
  });
}

export function subscribe<T, R>(iter: AsyncIterator<T, R>): Subscription<T, R> {
  return {
    next: () => call(iter.next),
  };
}

export function stream<T, R>(iterable: AsyncIterable<T, R>): Stream<T, R> {
  return {
    *subscribe() {
      return subscribe(iterable[Symbol.asyncIterator]());
    },
  };
}

interface AsyncIterable<T, TReturn = unknown> {
  [Symbol.asyncIterator](): AsyncIterator<T, TReturn>;
}
