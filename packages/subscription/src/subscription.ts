import { Operation } from '@effection/core';
import { OperationIterator } from './operation-iterator';

/**
 * A Subscription functions as an iterator over a stream of values. Taking the
 * next value from the subscription returns the next value and crucially also
 * removes it, so we don't iterate the same value twice. Subscriptions are
 * stateful objects, and calling methods such as next or expect on them changes
 * the state of the subscription.
 *
 * See [the guide on Streams and Subscriptions](https://frontside.com/effection/docs/guides/collections) for more details.
 *
 * @typeParam T the type of the items in the queue
 * @typeParam TReturn the type of the value that the subscription finishes with
 */
export interface Subscription<T, TReturn = undefined> extends OperationIterator<T, TReturn> {
  /**
   * Consume and return the next value of the subscription, if the subscription
   * finishes before it returns another value then `undefined` is returned.
   */
  first(): Operation<T | undefined>;

  /**
   * Consume and return the next value of the subscription, if the subscription
   * finishes before it returns another value then an error is thrown.
   */
  expect(): Operation<T>;

  /**
   * Iterate the subscription, passing each value to the given callback. Blocks
   * until the subscription finishes, and returns the value it finished with.
   *
   * The callback can be either a regular function which returns `undefined`,
   * or an operation. If it is an operation, then `forEach` will block until
   * the operation is complete before invoking the callback again.
   *
   * ### Example
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<number, string>();
   *   queue.send(1);
   *   queue.send(2);
   *   queue.close("I'm done");
   *
   *   let result = yield queue.forEach((value) => { console.log(value) }); // => '1', '2'
   *   console.log(result); // => 'I'm done'
   * });
   * ```
   */
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;

  /**
   * Block until the subscription finishes, and return the value it finished
   * with.
   *
   * ### Example
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<number, string>();
   *   queue.send(1);
   *   queue.close("I'm done");
   *
   *   let result = yield queue.join();
   *   console.log(result); // => "I'm done"
   * });
   * ```
   */
  join(): Operation<TReturn>;

  /**
   * Block until the subscription finishes, and return a synchronous iterator
   * over all of the emitted values.
   *
   * ### Example
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<number, string>();
   *   queue.send(1);
   *   queue.close("I'm done");
   *
   *   let iterator = yield queue.collect();
   *
   *   console.log(iterator.next()); // => { done: false, value: 1 }
   *   console.log(iterator.next()); // => { done: true, value: "I'm done" }
   * });
   * ```
   */
  collect(): Operation<Iterator<T, TReturn>>;

  /**
   * Block until the subscription finishes, and return an array of all of the
   * emitted values.
   *
   * ### Example
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<string>();
   *   queue.send('hello');
   *   queue.send('world');
   *   queue.close();
   *
   *   let result = yield queue.toArray();
   *   console.log(result); // => ['hello', 'world']
   * });
   * ```
   */
  toArray(): Operation<T[]>;
}
