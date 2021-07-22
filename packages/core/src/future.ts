import { HaltError } from './halt-error';
import { createRunLoop } from './run-loop';

export type State = 'pending' | 'errored' | 'completed' | 'halted';

export type Value<T> =
  | { state: 'errored'; error: Error }
  | { state: 'completed'; value: T }
  | { state: 'halted' };

export interface Consumer<T> {
  (value: Value<T>): void;
}

export interface FutureLike<T> {
  consume<R>(consumer: Consumer<T>): void;
}

export interface Future<T> extends Promise<T>, FutureLike<T> {
  state: State;
}

export interface NewFuture<T> {
  future: Future<T>;
  produce(value: Value<T>): void;
  /** @deprecated Use produce(value) instead */
  resolve(value: Value<T>): void;
}

export function createFuture<T>(): NewFuture<T> {
  let runLoop = createRunLoop();
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

  function resolve(value: Value<T>) {
    console.warn(`DEPRECATED: resolve() is deprecated and will be changed or removed prior to the release of effection 2.0\nuse produce() instead`);
    produce(value);
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
    resolve
  }
}
