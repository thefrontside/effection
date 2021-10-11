import { createQueue, Subscription } from '@effection/subscription';
import { Operation, Task, Resource, spawn } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { createBuffer } from './buffer';

/**
 * A callback operation to {@link createStream}. This is an operation which takes
 * a `publish` function as an argument. Each time the publish function is
 * invoked with a value, the stream emits that value.
 *
 * @typeParam T the type of the values that are emitted by the stream
 * @typeParam TReturn the return value of the operation
 */
export type StreamCallback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

/**
 * A `Stream` of values. A `Stream` can be subscribed to, which creates an
 * iterable `Subscription`.
 *
 * See [the guide on Streams and Subscriptions](https://frontside.com/effection/docs/guides/collections) for more details.
 *
 * @typeParam T the type of the values that are emitted by the stream
 * @typeParam TReturn the return value of the operation
 */
export interface Stream<T, TReturn = undefined> extends Resource<Subscription<T, TReturn>> {
  /**
   * Create a new `Stream` which only emits those values for which the filter
   * predicate returns `true`. This is similar to the `filter` method on `Array`.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   * });
   * let publishedComments = comments.filter((c) => c.state === 'published');
   * yield publishedComments.forEach(console.log); // => { text: "hello", state: "published" }
   * ```
   *
   * @param predicate a function which takes a stream item and returns true or false
   * @typeParam R the type of the items of the returned stream which is narrowed if the filter predicate is able to narrow the type of `T`
   */
  filter<R extends T>(predicate: (value: T) => value is R): Stream<R, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;
  filter(predicate: (value: T) => boolean): Stream<T, TReturn>;

  /**
   * Create a new `Stream` which only emits those values for which the item matches
   * the structure of the given reference item, that is all keys and values in the
   * reference must match the item.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   * });
   * let publishedComments = comments.match({ state: 'published' });
   * yield publishedComments.forEach(console.log); // => { text: "hello", state: "published" }
   * ```
   *
   * @param reference a reference item that the stream items are matched against.
   */
  match(reference: DeepPartial<T>): Stream<T,TReturn>;

  /**
   * Create a new `Stream` which only emits those values for which the item contains
   * the given string as a substring, or matches the given regexp.
   *
   * ### Example
   *
   * ```typescript
   * let words = createStream(function*(publish) {
   *   ["effection", "frontside", "frontend", "fiesta"].forEach(publish);
   * });
   * yield words.grep("front").forEach(console.log); // => frontside, frontend
   * yield words.grep(/^f/).forEach(console.log); // => frontside, frontend, fiesta
   * ```
   *
   * @param search match each item against this substring or regexp
   */
  grep(search: string | RegExp): Stream<T,TReturn>;

  /**
   * Create a new `Stream` which applies the given mapping function to each
   * item. This is similar to the `map` method on `Array`.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   * });
   *
   * let commentTexts = comments.map((comment) => comment.text);
   *
   * yield commentTexts.forEach(console.log); // => "hello", "world"
   * ```
   *
   * @typeParam R the type of the mapped items
   * @param mapper a mapping function to apply to the items in the stream
   */
  map<R>(mapper: (value: T) => R): Stream<R, TReturn>;

  /**
   * Returns the first item in the stream, or `undefined` if the stream
   * closes before another item is emitted.
   */
  first(): Operation<T | undefined>;

  /**
   * Returns the first item in the stream, or throws an error if the stream
   * closes before before another item is emitted.
   */
  expect(): Operation<T>;

  /**
   * Iterates all items of the stream, returns the value the stream closes
   * with. The given callback is invoked for each item in the stream. The
   * callback can be either a regular function which returns `undefined`, or an
   * operation.
   *
   * ### Example
   *
   * Iterating with a regular function:
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   *   return 2;
   * });
   *
   * let result = yield comments.forEach((item) => {
   *   console.log(item);
   * });
   *
   * console.log(result) // => 2
   * ```
   *
   * Iterating with an operation:
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   * });
   *
   * yield comments.forEach(function*(value) {
   *   yield createComment(value);
   * });
   * ```
   *
   */
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;

  /**
   * Wait for the stream to close and return the value it closes with.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish({ text: "hello", state: "published" });
   *   publish({ text: "world", state: "draft" });
   *   return 2;
   * });
   *
   * let result = yield comments.join();
   *
   * console.log(result) // => 2
   * ```
   */
  join(): Operation<TReturn>;

  /**
   * Block until the stream finishes, and return a synchronous iterator over
   * all of the emitted values.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish("hello");
   *   publish("world");
   *   return 2;
   * });
   *
   * let result = yield comments.collect();
   *
   * console.log(result.next()); // => { done: false, value: "hello" }
   * console.log(result.next()); // => { done: false, value: "world" }
   * console.log(result.next()); // => { done: true, value: 2 }
   * ```
   */
  collect(): Operation<Iterator<T, TReturn>>;

  /**
   * Block until the stream finishes and return an array of all of the items
   * that were emitted.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   publish("hello");
   *   publish("world");
   *   return 2;
   * });
   *
   * let result = yield comments.toArray();
   *
   * console.log(result); // => ["hello", "world"]
   * ```
   */
  toArray(): Operation<T[]>;

  /**
   * @hidden
   */
  subscribe(scope: Task): Subscription<T, TReturn>;

  /**
   * Returns a buffer which will be filled as items are emitted to the stream.
   * The buffer can be iterated synchronously, and so it can be used to keep
   * track of the items that were emitted by the stream.
   *
   * If the `limit` is given, then the size of the buffer is limited to that
   * number of items. If the limit is exceeded, the oldest item gets removed
   * from the buffer. Internally this uses a ringbuffer to make this efficient.
   *
   * ### Example
   *
   * ```typescript
   * let comments = createStream(function*(publish) {
   *   yield sleep(50);
   *   publish("hello");
   *   publish("world");
   * });
   *
   * let buffer = yield comments.toBuffer();
   *
   * console.log(Array.from(buffer)); // => []
   *
   * yield sleep(100);
   *
   * console.log(Array.from(buffer)); // => ["hello", "world"]
   * ```
   *
   * @param limit the maximum number of items to cache, if omitted the limit is infinite
   */
  toBuffer(limit?: number): Resource<Iterable<T>>;

  /**
   * Returns a new stream which keeps track of and emits all items that were
   * emitted since `buffered` was called. Internally this uses a buffer to
   * store the last items with an optional `limit`.
   *
   * If the `limit` is given, then the size of the buffer is limited to that
   * number of items. If the limit is exceeded, the oldest item gets removed
   * from the buffer. Internally this uses a ringbuffer to make this efficient.
   *
   * Note that an unlimited buffer will never be emptied, and so it will grow
   * forever. Be careful as this might constitute a memory leak.
   *
   * ### Example
   *
   * ```typescript
   * // we use a `Channel` to illustrate this, a channel is also a `Stream`
   * let comments = createChannel();
   *
   * yield spawn(function*(publish) {
   *   yield sleep(50);
   *   comments.send("hello");
   *   yield sleep(50);
   *   comments.send("world");
   *   comments.close();
   * });
   *
   * // we create a buffered stream here
   * let bufferedComments = yield comments.buffered();
   *
   * // after this sleep "hello" has been emitted, but "world" has not
   * yield sleep(75);
   *
   * // iterating `comments` at this point, we will not receive the "hello" item
   * yield spawn(comments.forEach(console.log)); // "world"
   *
   * // if we iterate the buffered stream, we get both emitted items
   * yield spawn(bufferedComments.forEach(console.log)); // "hello", "world"
   * ```
   *
   * @param limit the maximum number of items to cache, if omitted the limit is infinite
   */
  buffered(limit?: number): Resource<Stream<T, TReturn>>;
}

/**
 * Create a new stream of values. The given callback operation is run each time
 * someone subscribes to the stream, so it may be invoked multiple times. The
 * stream emits a value each time the `publish` function passed as an argument
 * to the callback is invoked. The stream is closed when the callback function
 * returns, and the return value of the callback is the value the stream closes
 * with.
 *
 * ### Example
 *
 * ```typescript
 * import { main, createStream, sleep, all } from 'effection';
 *
 * main(function*() {
 *   let stream = createStream<number, string>(function*(publish) {
 *     yield sleep(100);
 *     publish(1);
 *     yield sleep(100);
 *     publish(2);
 *     return "I'm done";
 *   });
 *
 *   // we can subscribe multiple times
 *   let result = yield all([
 *     stream.forEach((value) => { console.log(value) }); // => '1', '2'
 *     stream.forEach((value) => { console.log(value) }); // => '1', '2'
 *   ]);
 *   console.log(result) // => ["I'm done", "I'm done"]
 * });
 * ```
 *
 * See [the guide on Streams and Subscriptions](https://frontside.com/effection/docs/guides/collections) for more details.
 */
export function createStream<T, TReturn = undefined>(callback: StreamCallback<T, TReturn>, name = 'stream'): Stream<T, TReturn> {
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

    toBuffer(limit = Infinity): Resource<Iterable<T>> {
      return {
        name: `${name}.buffer(${limit})`,
        *init() {
          let buffer = createBuffer<T>(limit);

          yield spawn(stream.forEach((value) => { buffer.push(value) }));

          return buffer;
        }
      };
    },

    buffered(limit = Infinity): Resource<Stream<T, TReturn>> {
      return {
        *init() {
          let buffer = yield stream.toBuffer(limit);

          return createStream<T, TReturn>((publish) => function*() {
            for(let value of buffer) {
              publish(value);
            }
            return yield stream.forEach(publish);
          }, `${name}.buffered(${limit})`);
        }
      };
    }
  };

  return stream;
}
