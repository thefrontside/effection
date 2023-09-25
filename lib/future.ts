import type { Future, Result } from "./types.ts";

import { action, suspend } from "./instructions.ts";
import { lazy } from "./lazy.ts";
import { Err, Ok } from "./result.ts";

export interface NewFuture<T> {
  resolve(value: T): void;
  reject(error: Error): void;
  future: Future<T>;
}

export function createFuture<T>(): NewFuture<T> {
  let result: Result<T> | null = null;

  let watchers = new Set<Watcher<T>>();

  let promise = lazy(
    () =>
      new Promise<T>((resolve, reject) => {
        watchers.add({ resolve, reject });
        notify();
      }),
  );

  function notify() {
    if (result) {
      while (watchers.size > 0) {
        for (let watcher of watchers) {
          watchers.delete(watcher);
          if (result.ok) {
            watcher.resolve(result.value);
          } else {
            watcher.reject(result.error);
          }
        }
      }
    }
  }

  let settle: Watcher<T> = {
    resolve(value) {
      result = Ok(value);
      settle.resolve = settle.reject = () => {};
      notify();
    },
    reject(error) {
      result = Err(error);
      settle.resolve = settle.reject = () => {};
      notify();
    },
  };

  let future: Future<T> = {
    [Symbol.toStringTag]: "Future",
    *[Symbol.iterator]() {
      if (result) {
        if (result.ok) {
          return result.value;
        } else {
          throw result.error;
        }
      } else {
        return yield* action<T>(function* (resolve, reject) {
          let watcher = { resolve, reject };
          watchers.add(watcher);
          try {
            yield* suspend();
          } finally {
            watchers.delete(watcher);
          }
        });
      }
    },
    then: (...args) => promise().then(...args),
    catch: (...args) => promise().catch(...args),
    finally: (...args) => promise().finally(...args),
  };

  return {
    future,
    resolve: (value) => settle.resolve(value),
    reject: (error) => settle.reject(error),
  };
}

type Watcher<T> = Omit<NewFuture<T>, "future">;
