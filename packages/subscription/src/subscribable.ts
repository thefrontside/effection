import { Operation, Task } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { OperationIterator } from './operation-iterator';
import { OperationIterable } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';
import { Callback, createOperationIterator } from './create-operation-iterator';

export interface Subscribable<T, TReturn = undefined> extends OperationIterable<T, TReturn> {
  filter(predicate: (value: T) => boolean): Subscribable<T, TReturn>;
  match(reference: DeepPartial<T>): Subscribable<T,TReturn>;
  map<R>(mapper: (value: T) => R): Subscribable<R, TReturn>;

  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => Operation<void>): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
  subscribe(task: Task): OperationIterator<T, TReturn>;
}

export function createSubscribable<T, TReturn = undefined>(callback: Callback<T, TReturn>): Subscribable<T, TReturn> {
  let subscribe = (task: Task) => createOperationIterator(task, callback);

  let subscribable = {
    filter(predicate: (value: T) => boolean): Subscribable<T, TReturn> {
      return createSubscribable((publish) => {
        return subscribable.forEach((value) => function*() {
          if(predicate(value)) {
            publish(value);
          }
        });
      });
    },

    match(reference: DeepPartial<T>): Subscribable<T,TReturn> {
      return subscribable.filter(matcher(reference));
    },

    map<R>(mapper: (value: T) => R): Subscribable<R, TReturn> {
      return createSubscribable((publish) => {
        return subscribable.forEach((value: T) => function*() {
          publish(mapper(value));
        });
      });
    },

    first(): Operation<T | undefined> {
      return function*(task) {
        let iterator = subscribe(task);
        let result: IteratorResult<T,TReturn> = yield iterator.next();
        if(result.done) {
          return undefined;
        } else {
          return result.value;
        }
      }
    },

    expect(): Operation<T> {
      return function*(task) {
        let iterator = subscribe(task);
        let result: IteratorResult<T,TReturn> = yield iterator.next();
        if(result.done) {
          throw new Error('expected subscription to contain a value');
        } else {
          return result.value;
        }
      }
    },

    forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
      return function*(task) {
        let iterator = subscribe(task);
        while (true) {
          let result: IteratorResult<T,TReturn> = yield iterator.next();
          if(result.done) {
            return result.value;
          } else {
            yield visit(result.value);
          }
        }
      }
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return function*() {
        let items: T[] = [];
        let result = yield subscribable.forEach((item) => function*() { items.push(item); });
        return (function*() {
          yield *items;
          return result;
        })();
      }
    },

    toArray(): Operation<T[]> {
      return function*() {
        return Array.from<T>(yield subscribable.collect());
      }
    },

    subscribe,

    [SymbolOperationIterable]: subscribe,
  };

  return subscribable;
}
