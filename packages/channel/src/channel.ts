import { createStream, WritableStream, Writable, Stream } from '@effection/stream';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

/**
 * @hidden
 */
export type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

/**
 * @hidden
 */
export type Send<T> = Writable<T>['send'];

/**
 * Options which can be provided when creating a {@link Channel} via {@link createChannel}.
 */
export type ChannelOptions = {
  /**
   * The maximum number of subscribers that the channel should have. When this limit is exceeded
   * a warning is printed to the console.
   */
  maxSubscribers?: number;

  /**
   * The name of the channel. Useful for debugging purposes.
   */
  name?: string;
}

/**
 * A `Channel` functions as a broadcast channel, so that multiple consumers cann subscribe
 * to the same `Stream`, and messages sent to the channel are received by all consumers. The
 * channel is not buffered, so if there are no consumers, the message is dropped.
 */
export interface Channel<T, TClose = undefined> extends WritableStream<T, T, TClose> {
  close: Close<TClose>;
  stream: Stream<T, TClose>;
}

/**
 * Create a new {@link Channel}.
 *
 * See [the guide on Streams and Subscriptions](https://frontside.com/effection/docs/guides/collections) for more details.
 *
 * ### Example
 *
 * ``` javascript
 * import { main, createChannel } from 'effection';
 *
 * main(function*() {
 *   let channel = createChannel();
 *
 *   channel.send('too early'); // the channel has no subscribers yet!
 *
 *   let firstSubscription = yield channel.subscribe();
 *   let secondSubscription = yield channel.subscribe();
 *
 *   channel.send('hello');
 *   channel.send('world');
 *
 *   console.log(yield firstSubscription.expect()); // logs 'hello'
 *   console.log(yield firstSubscription.expect()); // logs 'world'
 *   console.log(yield secondSubscription.expect()); // logs 'hello'
 *   console.log(yield secondSubscription.expect()); // logs 'world'
 * });
 * ```
 */
export function createChannel<T, TClose = undefined>(options: ChannelOptions = {}): Channel<T, TClose> {
  let bus = new EventEmitter();

  if(options.maxSubscribers) {
    bus.setMaxListeners(options.maxSubscribers);
  } else {
    bus.setMaxListeners(100000);
  }

  let stream = createStream<T, TClose>((publish) => function*(task) {
    let subscription = on(bus, 'event').subscribe(task);
    while(true) {
      let { value: next } = yield subscription.next();
      if(next.done) {
        return next.value;
      } else {
        publish(next.value);
      }
    }
  }, options.name);

  let send: Send<T> = (message: T) => {
    bus.emit('event', { done: false, value: message });
  };

  let close: Close<TClose> = (...args) => {
    bus.emit('event', { done: true, value: args[0] });
  };

  return { send, close, stream , ...stream };
}
