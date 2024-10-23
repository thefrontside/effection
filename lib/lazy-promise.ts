import { Err, Ok, Result } from "./result.ts";

type PromiseWithResolvers<T> = ReturnType<typeof Promise.withResolvers<T>>;

export function lazyPromiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let result: Result<T> | undefined = undefined;

  let settle = (outcome: Result<T>) => {
    if (!result) {
      result = outcome;
    }
  };

  let resolve = ((value: T) => settle(Ok(value))) as PromiseWithResolvers<
    T
  >["resolve"];
  let reject = (error: Error) => settle(Err(error));

  let promise = lazyPromise<T>((resolve, reject) => {
    let record = (result: Result<T>) => {
      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    };

    if (result) {
      record(result);
    } else {
      settle = record;
    }
  });

  return { promise, resolve, reject };
}

export function lazyPromise<T>(
  resolver: (
    resolve: (value: T) => void,
    reject: (error: Error) => void,
  ) => void,
): Promise<T> {
  let _promise: Promise<T> | undefined = undefined;

  let reify = async () => {
    if (!_promise) {
      _promise = new Promise<T>(resolver);
    }
    return await _promise;
  };

  let promise: Promise<T> = Object.create(Promise.prototype, {
    then: {
      enumerable: false,
      value: (...args: Parameters<Promise<T>["then"]>) => reify().then(...args),
    },
    catch: {
      enumerable: false,
      value: (...args: Parameters<Promise<T>["catch"]>) =>
        reify().catch(...args),
    },
    finally: {
      enumerable: false,
      value: (...args: Parameters<Promise<T>["finally"]>) =>
        reify().finally(...args),
    },
  });

  return promise;
}
