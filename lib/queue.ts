import type { Resolve, Subscription } from "./types.ts";
import { pause } from "./pause.ts";

/**
 * A FIFO queue which can be used to implement the {@link Subscription}
 * interface directly. Most of the time, you will use either a {@link Signal}
 * or a {@link Channel} as the mechanism, but `Queue` allows you to manage
 * a single subscription directly.
 *
 * @typeParam T the type of the items in the queue
 * @typeParam TClose the type of the value that the queue is closed with
 */
export interface Queue<T, TClose> extends Subscription<T, TClose> {
  /**
   * Add a value to the queue. The oldest value currently in the queue will
   * be the first to be read.
   * @param item - the value to add
   */
  add(item: T): void;

  /**
   * Close the queue.
   * @param value - the queue's final value.
   */
  close(value: TClose): void;
}

/**
 * Creates a new queue. Queues are unlimited in size and sending a message to a
 * queue is always synchronous.
 *
 * @example
 *
 * ```javascript
 * import { each, main, createQueue } from 'effection';
 *
 * await main(function*() {
 *   let queue = createQueue<number>();
 *   queue.send(1);
 *   queue.send(2);
 *   queue.send(3);
 *
 *   let next = yield* queue.subscription.next();
 *   while (!next.done) {
 *     console.log("got number", next.value);
 *     next = yield* queue.subscription.next();
 *   }
 * });
 * ```
 *
 * @typeParam T the type of the items in the queue
 * @typeParam TClose the type of the value that the queue is closed with
 */
export function createQueue<T, TClose>(): Queue<T, TClose> {
  type Item = IteratorResult<T, TClose>;

  let items: Item[] = [];
  let consumers = new Set<Resolve<Item>>();

  function enqueue(item: Item) {
    items.unshift(item);
    while (items.length > 0 && consumers.size > 0) {
      let [consume] = consumers;
      let top = items.pop() as Item;
      consume(top);
    }
  }

  return {
    add: (value) => enqueue({ done: false, value }),
    close: (value) => enqueue({ done: true, value }),
    *next() {
      let item = items.pop();
      if (item) {
        return item;
      } else {
        return yield* pause<Item>((resolve) => {
          consumers.add(resolve);
          return () => consumers.delete(resolve);
        });
      }
    },
  };
}
