import { Operation, Task } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { OperationIterator } from './operation-iterator';
import { OperationIterable, ToOperationIterator } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';
import { Callback, createOperationIterator } from './create-operation-iterator';

export interface Stream<T, TReturn = undefined> extends OperationIterable<T, TReturn> {
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  match(reference: DeepPartial<T>): Stream<T,TReturn>;
  map<R>(mapper: (value: T) => R): Stream<R, TReturn>;

  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
  subscribe(scope: Task): OperationIterator<T, TReturn>;
  buffer(scope: Task): Stream<T, TReturn>;
  stringBuffer(scope: Task): StringBufferStream<TReturn>;
}

export interface StringBufferStream<TReturn = undefined> extends Stream<string, TReturn> {
  value: string;
}

export function createStream<T, TReturn = undefined>(callback: Callback<T, TReturn>): Stream<T, TReturn> {
  let iterable: ToOperationIterator<T, TReturn> = (task) => createOperationIterator(task, callback);

  let subscribable = {
    filter(predicate: (value: T) => boolean): Stream<T, TReturn> {
      return createStream((publish) => {
        return subscribable.forEach((value) => function*() {
          if(predicate(value)) {
            publish(value);
          }
        });
      });
    },

    match(reference: DeepPartial<T>): Stream<T,TReturn> {
      return subscribable.filter(matcher(reference));
    },

    map<R>(mapper: (value: T) => R): Stream<R, TReturn> {
      return createStream((publish) => {
        return subscribable.forEach((value: T) => function*() {
          publish(mapper(value));
        });
      });
    },

    first(): Operation<T | undefined> {
      return function*(task) {
        let iterator = iterable(task);
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
        let iterator = iterable(task);
        let result: IteratorResult<T,TReturn> = yield iterator.next();
        if(result.done) {
          throw new Error('expected subscription to contain a value');
        } else {
          return result.value;
        }
      }
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return function*(task) {
        let iterator = iterable(task);
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

    join(): Operation<TReturn> {
      return subscribable.forEach(() => { /* no op */ });
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

    buffer(scope: Task): Stream<T, TReturn> {
      let buffer: T[] = [];

      scope.spawn(subscribable.forEach((m) => { buffer.push(m) }));

      return createStream((publish) => function*() {
        buffer.forEach(publish);
        return yield subscribable.forEach(publish);
      });
    },

    stringBuffer(scope: Task): StringBufferStream<TReturn> {
      let buffer = "";

      scope.spawn(subscribable.forEach((m) => { buffer += `${m}` }));

      let stream = createStream<string, TReturn>((publish) => function*() {
        let internalBuffer = buffer;
        publish(internalBuffer);
        return yield subscribable.forEach((m: T) => {
          internalBuffer += `${m}`;
          publish(internalBuffer);
        });
      });

      return {
        ...stream,
        get value(): string {
          return buffer;
        }
      }
    },

    subscribe(scope: Task): OperationIterator<T, TReturn> {
      return iterable(scope);
    },

    get [SymbolOperationIterable](): ToOperationIterator<T, TReturn> {
      return iterable;
    },
  };

  return subscribable;
}
