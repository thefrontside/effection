import type { Channel, Operation } from "./types.ts";
import { createSignal } from "./signal.ts";

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
 *   let { input, output } = createChannel();
 *
 *   yield* input.send('too early'); // the channel has no subscribers yet!
 *
 *   let subscription1 = yield* channel;
 *   let subscription2 = yield* channel;
 *
 *   yield* input.send('hello');
 *   yield* input.send('world');
 *
 *   console.log(yield* subscription1.next()); //=> { done: false, value: 'hello' }
 *   console.log(yield* subscription1.next()); //=> { done: false, value: 'world' }
 *   console.log(yield* subscription2.next()); //=> { done: false, value: 'hello' }
 *   console.log(yield* subscription2.next()); //=> { done: false, value: 'world' }
 * });
 * ```
 *
 * @typeParam T - the type of each value sent to the channel
 * @typeParam TClose - the type of the channel's final value.
 */
export function createChannel<T, TClose = void>(): Channel<T, TClose> {
  let signal = createSignal<T, TClose>();

  let input = {
    *send(value: T): Operation<void> {
      signal.send(value);
    },
    *close(value: TClose) {
      signal.close(value);
    },
  };

  return { input, subscribe: signal.subscribe };
}
