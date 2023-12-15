import type { Stream, Subscription } from "./types.ts";

import { call } from "./call.ts";

export function subscribe<T, R>(iter: AsyncIterator<T, R>): Subscription<T, R> {
  return {
    next: () => call(() => iter.next()),
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
