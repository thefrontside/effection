import { Operation, Task } from '@effection/core';
import { OperationIterator } from './operation-iterator';
import { Callback, createOperationIterator } from './create-operation-iterator';

export interface Subscription<T, TReturn = undefined> extends OperationIterator<T, TReturn> {
  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
}

export function createSubscription<T, TReturn = undefined>(task: Task<unknown>, callback: Callback<T, TReturn>): Subscription<T, TReturn> {
  let iterator = createOperationIterator(task, callback);

  let subscription = {
    first(): Operation<T | undefined> {
      return function*() {
        let result: IteratorResult<T, TReturn> = yield iterator.next();
        if(result.done) {
          return undefined;
        } else {
          return result.value;
        }
      }
    },

    expect(): Operation<T> {
      return function*() {
        let result: IteratorResult<T, TReturn> = yield iterator.next();
        if(result.done) {
          throw new Error('expected to contain a value');
        } else {
          return result.value;
        }
      }
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return function*() {
        while (true) {
          let result: IteratorResult<T,TReturn> = yield iterator.next();
          if(result.done) {
            return result.value;
          } else {
            let operation = visit(result.value);
            if(operation) {
              yield operation;
            }
          }
        }
      }
    },

    next() {
      return iterator.next();
    },

    join(): Operation<TReturn> {
      return subscription.forEach(() => { /* no op */ });
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return function*() {
        let items: T[] = [];
        let result = yield subscription.forEach((item) => function*() { items.push(item); });
        return (function*() {
          yield *items;
          return result;
        })();
      }
    },

    toArray(): Operation<T[]> {
      return function*() {
        return Array.from<T>(yield subscription.collect());
      }
    },
  };

  return subscription;
};
