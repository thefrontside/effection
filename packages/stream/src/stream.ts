import { createQueue, Subscription } from '@effection/subscription';
import { Operation, Task, Resource, spawn } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { createBuffer } from './buffer';

export type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Stream<T, TReturn = undefined> extends Resource<Subscription<T, TReturn>> {
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
  buffer(limit?: number): Resource<Stream<T, TReturn>>;
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

    buffer(limit = Infinity): Resource<Stream<T, TReturn>> {
      return {
        *init() {
          let buffer = createBuffer<T>(limit);

          yield spawn(stream.forEach((value) => { buffer.push(value) }));

          return createStream<T, TReturn>((publish) => function*() {
            for(let value of buffer) {
              publish(value);
            }
            return yield stream.forEach(publish);
          });
        }
      };
    }
  };

  return stream;
}
