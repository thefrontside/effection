import { Operation, Task } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { Subscription, createSubscription } from './subscription';
import { OperationIterable, ToOperationIterator } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';
import { Callback } from './create-operation-iterator';

export interface Stream<T, TReturn = undefined> extends OperationIterable<T, TReturn> {
  filter<R extends T>(predicate: (value: T) => value is R): Stream<R, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  match(reference: DeepPartial<T>): Stream<T,TReturn>;
  map<R>(mapper: (value: T) => R): Stream<R, TReturn>;

  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
  subscribe(scope: Task): Subscription<T, TReturn>;
  buffer(scope: Task): Stream<T, TReturn>;
  stringBuffer(scope: Task): StringBufferStream<TReturn>;
}

export interface StringBufferStream<TReturn = undefined> extends Stream<string, TReturn> {
  value: string;
}

export function createStream<T, TReturn = undefined>(callback: Callback<T, TReturn>): Stream<T, TReturn> {
  let subscribable = (task: Task) => createSubscription(task, callback);

  function filter<R extends T>(predicate: (value: T) => value is R): Stream<T, TReturn>
  function filter(predicate: (value: T) => boolean): Stream<T, TReturn>
  function filter(predicate: (value: T) => boolean): Stream<T, TReturn> {
    return createStream((publish) => {
      return stream.forEach((value) => function*() {
        if(predicate(value)) {
          publish(value);
        }
      });
    });
  };

  let stream = {
    filter,

    match(reference: DeepPartial<T>): Stream<T,TReturn> {
      return stream.filter(matcher(reference));
    },

    map<R>(mapper: (value: T) => R): Stream<R, TReturn> {
      return createStream((publish) => {
        return stream.forEach((value: T) => function*() {
          publish(mapper(value));
        });
      });
    },

    first(): Operation<T | undefined> {
      return function*(task) {
        return yield subscribable(task).first();
      };
    },

    expect(): Operation<T> {
      return function*(task) {
        return yield subscribable(task).expect();
      }
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return function*(task) {
        return yield subscribable(task).forEach(visit);
      }
    },

    join(): Operation<TReturn> {
      return function*(task) {
        return yield subscribable(task).join();
      }
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return function*(task) {
        return yield subscribable(task).collect();
      }
    },

    toArray(): Operation<T[]> {
      return function*(task) {
        return yield subscribable(task).toArray();
      }
    },

    buffer(scope: Task): Stream<T, TReturn> {
      let buffer: T[] = [];

      scope.spawn(stream.forEach((m) => { buffer.push(m) }));

      return createStream((publish) => function*() {
        buffer.forEach(publish);
        return yield stream.forEach(publish);
      });
    },

    stringBuffer(scope: Task): StringBufferStream<TReturn> {
      let buffer = "";

      scope.spawn(stream.forEach((m) => { buffer += `${m}` }));

      let result = createStream<string, TReturn>((publish) => function*() {
        let internalBuffer = buffer;
        publish(internalBuffer);
        return yield stream.forEach((m: T) => {
          internalBuffer += `${m}`;
          publish(internalBuffer);
        });
      });

      return {
        ...result,
        get value(): string {
          return buffer;
        }
      }
    },

    subscribe(scope: Task): Subscription<T, TReturn> {
      return subscribable(scope);
    },

    get [SymbolOperationIterable](): ToOperationIterator<T, TReturn> {
      return subscribable;
    },
  };

  return stream;
}
