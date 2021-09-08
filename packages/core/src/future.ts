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

export interface FutureLike<T> {
  consume(consumer: Consumer<T>): void;
}

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

export const Future = {
  resolve<T>(value: T): Future<T> {
    let { future, resolve } = createFuture<T>();
    resolve(value);
    return future;
  },

  reject<T = unknown>(error: Error): Future<T> {
    let { future, reject } = createFuture<T>();
    reject(error);
    return future;
  },

  halt<T = unknown>(): Future<T> {
    let { future, halt } = createFuture<T>();
    halt();
    return future;
  },
};
