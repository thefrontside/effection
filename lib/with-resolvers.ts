import { Err, Ok, type Result } from "./result.ts";
import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * The return type of [withResolvers](/api/withResolvers). It contains an operation bundled with
 * synchronous functions that determine its outcome.
 */
export interface WithResolvers<T> {
  /*
   * An [Operation](/api/Operation) that will either produce a value or raise an
   * exception when either `resolve` or `reject` is called. No matter
   * how many times this operation is yielded to, it will always
   * produce the same effect.
   */
  operation: Operation<T>;

  /**
   * Cause [operation](/api/operation) to produce `value`. If either `resolve`
   * or`reject` has been called before, this will have no effect.
   */
  resolve(value: T): void;

  /**
   * Cause [operation](/api/operation) to raise `Error`. Any calling operation
   * waiting on `operation` will. Yielding to `operation` subsequently
   * will also raise the same error. * If either `resolve` or`reject`
   * has been called before, this will have no effect.
   */
  reject(error: Error): void;
}

/**
 * Create an [Operation](/api/Operation) and two functions to resolve or reject
 * it, corresponding to the two parameters passed to the executor of
 * the [action](/api/action) constructor. This is the Effection equivalent of
 * [Promise.withResolvers()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers)
 *
 * Returns an operation and its resolvers.
 */

export function withResolvers<T>(description?: string): WithResolvers<T> {
  let continuations = new Set<(result: Result<T>) => void>();
  let result: Result<T> | undefined = undefined;

  let operation: Operation<T> = action<T>(
    function (resolve, reject) {
      let settle = (outcome: Result<T>) => {
        if (outcome.ok) {
          resolve(outcome.value);
        } else {
          reject(outcome.error);
        }
      };

      if (result) {
        settle(result);
        return () => {};
      } else {
        continuations.add(settle);
        return () => continuations.delete(settle);
      }
    },
    description,
  );

  let settle = (outcome: Result<T>) => {
    if (!result) {
      result = outcome;
    }
    for (let continuation of continuations) {
      continuation(result);
    }
  };

  let resolve = (value: T) => settle(Ok(value));
  let reject = (error: Error) => settle(Err(error));

  return { operation, resolve, reject };
}
