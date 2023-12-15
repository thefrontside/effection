import type { Stream, Subscription } from "./types.ts";

import { call } from "./call.ts";

/**
 * Convert any [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) into an effection {@link Subscription}
 *
 * This allows you to consume any `AsyncIterator` as a {@link Subscription}.
 *
 * @param iter - the iterator to convert
 * @returns a subscription that will produce each item of `iter`
 */
export function subscribe<T, R>(iter: AsyncIterator<T, R>): Subscription<T, R> {
  return {
    next: () => call(() => iter.next()),
  };
}

/**
 * Convert any [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) into an Effection {@link Stream}.
 *
 * This allows you to consume any `AsyncIterable` as a {@link Stream}.
 *
 * @param iterable - the async iterable to convert
 * @returns a stream that will produce each item of `iterable`
 */
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
