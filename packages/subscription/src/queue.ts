import { Operation, withLabels, createFuture } from '@effection/core';
import { Subscription } from './index';

type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

type Waiter<T, TClose> = (value: IteratorResult<T, TClose>) => void;

/**
 * A queue which can act as a subscription. It can be sent messages to and
 * which can be closed.
 *
 * @typeParam T the type of the items in the queue
 * @typeParam TClose the type of the value that the queue is closed with
 */
export interface Queue<T, TClose = undefined> extends Subscription<T, TClose> {
  /**
   * Send a value to the queue.
   */
  send(value: T): void;

  /**
   * Close the queue
   *
   * ### Example
   *
   * Closing queue with no close value:
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<number>();
   *   queue.close();
   *   yield queue.join();
   * });
   * ```
   *
   * Closing queue with close value:
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let queue = createQueue<number, string>();
   *   queue.close("I'm done");
   *   let value = yield queue.join();
   *   console.log(value) // => "I'm done"
   * });
   * ```
   */
  close: Close<TClose>;

  /**
   * Like {@link close}, but with no special case for closing a queue without a
   * value, this makes `closeWith` easier to use from generic code.
   */
  closeWith(value: TClose): void;

  /**
   * Return a subscription for this queue. Useful when using destructuring
   * assignment.
   *
   * ### Example
   *
   * ```typescript
   * import { main, createQueue } from 'effection';
   *
   * main(function*() {
   *   let { send, subscription } = createQueue<number>();
   *   send(1);
   *   send(2);
   *   send(3);
   *
   *   yield subscription.forEach((value) => console.log("got number", value));
   * });
   * ```
   */
  subscription: Subscription<T, TClose>;
}

/**
 * Creates a new queue. Queues are unlimited in size and sending a message to a
 * queue is always synchronous.
 *
 * ### Example
 *
 * ```typescript
 * import { main, createQueue } from 'effection';
 *
 * main(function*() {
 *   let queue = createQueue<number>();
 *   queue.send(1);
 *   queue.send(2);
 *   queue.send(3);
 *
 *   yield queue.forEach((value) => console.log("got number", value));
 * });
 * ```
 *
 * @param name the name of the returned subscription, useful for debugging
 * @typeParam T the type of the items in the queue
 * @typeParam TClose the type of the value that the queue is closed with
 */
export function createQueue<T, TClose = undefined>(name = 'queue'): Queue<T, TClose> {
  let waiters: Waiter<T, TClose>[] = [];
  let values: IteratorResult<T, TClose>[] = [];
  let didClose = false;

  let send = (value: T): void => {
    if(didClose) {
      new Error(`tried to publish a value: ${value} on an already finished queue`);
    }

    let next = waiters.pop();
    if (next) {
      next({ value, done: false });
    } else {
      values.push({ value, done: false });
    }
  };

  let close = (value: TClose) => {
    if(didClose) {
      new Error('tried to close an already closed queue');
    }

    let next = waiters.pop();
    if (next) {
      next({ value, done: true });
    } else {
      values.push({ value, done: true });
    }
  };

  let next = (): Operation<IteratorResult<T, TClose>> => {
    return withLabels((task) => {
      let { future, resolve } = createFuture<IteratorResult<T, TClose>>();
      if(values.length) {
        resolve(values.shift() as IteratorResult<T, TClose>);
      } else {
        waiters.push(resolve);
        task.consume(() => {
          let index = waiters.indexOf(resolve);
          if(index > -1) {
            waiters.splice(index, 1);
          }
        });
      }
      return future;
    }, { name: `${name}.next()` });
  };

  function withName<T>(operationName: string, operation: Operation<T>): Operation<T> {
    return withLabels(operation, { name: `${name}.${operationName}()`, expand: false });
  }

  let subscription = {
    next,
    close: ((...args) => close(args[0] as TClose)) as Close<TClose>,
    closeWith: close,
    first(): Operation<T | undefined> {
      return withName<T | undefined>(`first`, function*() {
        let result: IteratorResult<T, TClose> = yield next();
        if(result.done) {
          return undefined;
        } else {
          return result.value;
        }
      });
    },

    expect(): Operation<T> {
      return withName('expect', function*() {
        let result: IteratorResult<T, TClose> = yield next();
        if(result.done) {
          throw new Error('expected to contain a value');
        } else {
          return result.value;
        }
      });
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TClose> {
      return withName('forEach', function* forEach() {
        while (true) {
          let result: IteratorResult<T,TClose> = yield next();
          if(result.done) {
            return result.value;
          } else {
            let operation = visit(result.value);
            if(operation) {
              yield operation;
            }
          }
        }
      });
    },

    join(): Operation<TClose> {
      return withName('join', subscription.forEach(() => { /* no op */ }));
    },

    collect(): Operation<Iterator<T, TClose>> {
      return withName<Iterator<T, TClose>>('collect', function*() {
        let items: T[] = [];
        let result = yield subscription.forEach((item) => function*() { items.push(item) });
        return (function*() {
          yield *items;
          return result;
        })();
      });
    },

    toArray(): Operation<T[]> {
      return withName('toArray', function*() {
        return Array.from<T>(yield subscription.collect());
      });
    },
  };

  return {
    send,
    subscription,
    ...subscription,
  };
}
