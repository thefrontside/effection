import type { Stream, Subscription } from "./types.ts";

import { call } from "./call.ts";

/**
 * Convert any [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) into an effection {@link Subscription}
 *
 * This allows you to consume any `AsyncIterator` as a {@link Subscription}.
 *
 * @example
 * ```ts
 * import { subscribe } from "effection";
 *
 * let response = await fetch("https://example.com/data.bin");
 * let iterator = response.body?.[Symbol.asyncIterator]();
 *
 * if (!iterator) throw new Error("response has no body");
 *
 * let subscription = subscribe(iterator);
 * let first = yield* subscription.next();
 * if (!first.done) {
 *   console.log(first.value); // Uint8Array chunk
 * }
 * ```
 *
 * @param iter - the iterator to convert
 * @returns a subscription that will produce each item of `iter`
 * @since 3.0
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
 * @example
 * ```ts
 * import { each, stream, until } from "effection";
 *
 * let response = yield* until(fetch("https://example.com/data.bin"));
 * if (!response.body) throw new Error("response has no body");
 *
 * for (let chunk of yield* each(stream(response.body))) {
 *   console.log(chunk.byteLength);
 *   yield* each.next();
 * }
 * ```
 *
 * @param iterable - the async iterable to convert
 * @returns a stream that will produce each item of `iterable`
 * @since 3.0
 */
export function stream<T, R>(iterable: AsyncIterable<T, R>): Stream<T, R> {
  return {
    *[Symbol.iterator]() {
      return subscribe(iterable[Symbol.asyncIterator]());
    },
  };
}

interface AsyncIterable<T, TReturn = unknown> {
  [Symbol.asyncIterator](): AsyncIterator<T, TReturn>;
}
