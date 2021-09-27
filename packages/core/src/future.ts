import { HaltError } from './halt-error';
import { createRunLoop, RunLoop } from './run-loop';

export type State = 'pending' | 'errored' | 'completed' | 'halted';

export type Value<T> =
  | { state: 'errored'; error: Error }
  | { state: 'completed'; value: T }
  | { state: 'halted' };

export interface Consumer<T> {
  (value: Value<T>): void;
}

/**
 * `FutureLike` is a slimmed down interface, similar to `PromiseLink` which
 * does not make equally strong requirements on the implementor. In Effection,
 * {@link Task} implements `FutureLike`, but not {@linkcode Future}.
 *
 * See [the Futures guide](https://frontside.com/effection/docs/guides/futures)
 * for a more detailed description of futures and how they work.
 */
export interface FutureLike<T> {
  consume(consumer: Consumer<T>): void;
}

/**
 * A Future represents a value which may or may not be available yet. It is
 * similar to a JavaScript Promise, except that it can resolve synchronously.
 *
 * See [the Futures guide](https://frontside.com/effection/docs/guides/futures)
 * for a more detailed description of futures and how they work.
 *
 * A Future may resolve to *three* different states. A Future can either become
 * `completed` with a value, it can become `errored` with an Error or it can
 * become `halted`, meaning it was prematurely cancelled.
 *
 * A Future can be created via the {@link createFuture} function, or via the
 * The `resolve`, `reject` and `halt` functions on {@link Future}.
 *
 * See also the slimmed down {@link FutureLike} interface.
 */
export interface Future<T> extends Promise<T>, FutureLike<T> {
  state: State;
}

export interface NewFuture<T> {
  future: Future<T>;
  produce(value: Value<T>): void;
  resolve(value: T): void;
  reject(error: Error): void;
  halt(): void;
}

/**
 * Create a new Future. This returns an object which contains the future itself
 * as well as a function to produce a value for the future, and also shortcuts
 * to resolve/reject/halt the future.
 *
 * ### Example
 *
 * ```typescript
 * import { createFuture } from 'effection';
 *
 * let { future, produce } = createFuture<number>();
 *
 * // later...
 * produce({ state: 'completed', value: 100 });
 *
 * future.consume((value) => console.log(value)) // => { state: 'completed', value: 100 }
 * ```
 *
 * ### Example using shortcut
 *
 * ```typescript
 * import { createFuture } from 'effection';
 *
 * let { future, resolve } = createFuture<number>();
 *
 * // later...
 * resolve(100);
 *
 * future.consume((value) => console.log(value)) // => { state: 'completed', value: 100 }
 * ```
 */
export function createFuture<T>(): NewFuture<T> {
  return createFutureOnRunLoop(createRunLoop('future'));
}

export function createFutureOnRunLoop<T>(runLoop: RunLoop): NewFuture<T> {
  let consumers: Consumer<T>[] = [];
  let result: Value<T>;

  function consume(consumer: Consumer<T>) {
    consumers.push(consumer);
    runLoop.run(run);
  }

  function run() {
    if(result) {
      while(true) {
        let consumer = consumers.shift();
        if(consumer) {
          consumer(result);
        } else {
          break;
        }
      }
    }
  }

  function produce(value: Value<T>) {
    if(!result) {
      result = value;
      runLoop.run(run);
    }
  }

  let promise: Promise<T>;

  function getPromise(): Promise<T> {
    return promise || (promise = new Promise<T>((resolve, reject) => {
      consume((value) => {
        if(value.state === 'completed') {
          resolve(value.value);
        } else if(value.state === 'errored') {
          reject(value.error);
        } else if(value.state === 'halted') {
          reject(new HaltError());
        }
      });
    }));
  }

  return {
    produce,
    future: {
      get state() { return result?.state || 'pending' },
      consume,
      then: (...args) => getPromise().then(...args),
      catch: (...args) => getPromise().catch(...args),
      finally: (...args) => getPromise().finally(...args),
      [Symbol.toStringTag]: '[continuation]',
    },
    resolve: (value: T) => produce({ state: 'completed', value }),
    reject: (error: Error) => produce({ state: 'errored', error }),
    halt: () => produce({ state: 'halted' }),
  };
}


/**
 * Namespace for `Future` functions to create resolved futures.
 *
 * See [Future](./interfaces/Future.html).
 */
export const Future = {
  /**
   * Create a future which has resolved successfully to a `completed` state.
   *
   * @param value The value to resolve to
   * @typeParam T The type that the future resolves to
   */
  resolve<T>(value: T): Future<T> {
    let { future, resolve } = createFuture<T>();
    resolve(value);
    return future;
  },

  /**
   * Create a future which has been rejected and is in an `errored` state.
   *
   * @param error The error that the future rejects with
   * @typeParam T The type that the future resolves to
   */
  reject<T = unknown>(error: Error): Future<T> {
    let { future, reject } = createFuture<T>();
    reject(error);
    return future;
  },

  /**
   * Create a future which has been halted and is in a `halted` state.
   *
   * @typeParam T The type that the future resolves to
   */
  halt<T = unknown>(): Future<T> {
    let { future, halt } = createFuture<T>();
    halt();
    return future;
  },
};
