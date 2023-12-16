import type { Operation, Stream } from "./types.ts";
import { createSignal } from "./signal.ts";
import { lift } from "./lift.ts";

/**
 * A broadcast channel that multiple consumers can subscribe to the
 * via the same {@link Stream}, and messages sent to the channel are
 * received by all consumers. The channel is not buffered, so if there
 * are no consumers, the message is dropped.
 */
export interface Channel<T, TClose> extends Stream<T, TClose> {
  /**
   * Send a message to all subscribers of this {@link Channel}
   */
  send(message: T): Operation<void>;

  /**
   * End every subscription to this {@link Channel}
   */
  close(value: TClose): Operation<void>;
}

/**
 * Create a new {@link Channel}. Use channels to communicate between operations.
 * In order to dispatch messages from outside an operation such as from a
 * callback, use {@link Signal}.
 *
 * See [the guide on Streams and
 * Subscriptions](https://frontside.com/effection/docs/guides/collections)
 * for more details.
 *
 * @example
 *
 * ``` javascript
 * import { main, createChannel } from 'effection';
 *
 * await main(function*() {
 *   let channel = createChannel();
 *
 *   yield* channel.send('too early'); // the channel has no subscribers yet!
 *
 *   let subscription1 = yield* channel;
 *   let subscription2 = yield* channel;
 *
 *   yield* channel.send('hello');
 *   yield* channel.send('world');
 *
 *   console.log(yield* subscription1.next()); //=> { done: false, value: 'hello' }
 *   console.log(yield* subscription1.next()); //=> { done: false, value: 'world' }
 *   console.log(yield* subscription2.next()); //=> { done: false, value: 'hello' }
 *   console.log(yield* subscription2.next()); //=> { done: false, value: 'world' }
 * });
 * ```
 */
export function createChannel<T, TClose = void>(): Channel<T, TClose> {
  let signal = createSignal<T, TClose>();

  return {
    send: lift(signal.send),
    close: lift(signal.close),
    [Symbol.iterator]: signal[Symbol.iterator],
  };
}
