import { createQueue, Subscription } from '@effection/subscription';
import { Operation, Task, Resource, spawn } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { OperationIterable, ToOperationIterator } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';

type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Stream<T, TReturn = undefined> extends OperationIterable<T, TReturn>, Resource<Subscription<T, TReturn>> {
  filter<R extends T>(predicate: (value: T) => value is R): Stream<R, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  match(reference: DeepPartial<T>): Stream<T,TReturn>;
  grep(search: string | RegExp): Stream<T,TReturn>;
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

export function createStream<T, TReturn = undefined>(callback: Callback<T, TReturn>, name = 'stream'): Stream<T, TReturn> {
  let subscribe = (task: Task) => {
    let queue = createQueue<T, TReturn>(name);
    task.run(function*() {
      let result = yield callback(queue.send);
      queue.closeWith(result);
    }, { labels: { name: 'publisher', expand: false } });
    return queue.subscription;
  };

  function filter<R extends T>(predicate: (value: T) => value is R): Stream<T, TReturn>
  function filter(predicate: (value: T) => boolean): Stream<T, TReturn>
  function filter(predicate: (value: T) => boolean): Stream<T, TReturn> {
    return createStream((publish) => {
      return stream.forEach((value) => function*() {
        if(predicate(value)) {
          publish(value);
        }
      });
    }, `${name}.filter()`);
  }

  let stream = {
    subscribe,

    filter,

    *init(task: Task) {
      return subscribe(task);
    },

    match(reference: DeepPartial<T>): Stream<T,TReturn> {
      return stream.filter(matcher(reference));
    },

    grep(search: string | RegExp): Stream<T,TReturn> {
      if(typeof(search) === 'string') {
        return stream.filter((value) => String(value).includes(search));
      } else {
        return stream.filter((value) => !!String(value).match(search));
      }
    },

    map<R>(mapper: (value: T) => R): Stream<R, TReturn> {
      return createStream((publish) => {
        return stream.forEach((value: T) => function*() {
          publish(mapper(value));
        });
      }, `${name}.map()`);
    },

    first(): Operation<T | undefined> {
      return task => subscribe(task).first();
    },

    expect(): Operation<T> {
      return task => subscribe(task).expect();
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return task => subscribe(task).forEach(visit);
    },

    join(): Operation<TReturn> {
      return task => subscribe(task).join();
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return task => subscribe(task).collect();
    },

    toArray(): Operation<T[]> {
      return task => subscribe(task).toArray();
    },

    buffer(scope: Task): Stream<T, TReturn> {
      let buffer: T[] = [];

      scope.run(stream.forEach((m) => { buffer.push(m) }));

      return createStream((publish) => function*() {
        buffer.forEach(publish);
        return yield stream.forEach(publish);
      });
    },

    stringBuffer(scope: Task): StringBufferStream<TReturn> {
      let buffer = "";

      scope.run(stream.forEach((m) => { buffer += `${m}` }));

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
      };
    },

    get [SymbolOperationIterable](): ToOperationIterator<T, TReturn> {
      return subscribe;
    },
  };

  return stream;
}

export const Stream = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge<T>(streams: Stream<T, any>[]): Stream<T> {
    return createStream<T>(function*(publish) {
      for(let stream of streams) {
        yield spawn(stream.forEach(publish), { blockParent: true });
      }
      return undefined;
    });
  }
};
