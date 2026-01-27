import { Err, Ok, type Result } from "./result.ts";
import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * The return type of {@link withResolvers}. It contains an operation bundled with
 * synchronous functions that determine its outcome.
 * @since 3.2
 */
export interface WithResolvers<T> {
  /*
   * An {@link Operation} that will either produce a value or raise an
   * exception when either `resolve` or `reject` is called. No matter
   * how many times this operation is yielded to, it will always
   * produce the same effect.
   */
  operation: Operation<T>;

  /**
   * Cause {@link operation} to produce `value`. If either `resolve`
   * or`reject` has been called before, this will have no effect.
   *
   * @param value - the value to produce
   */
  resolve(value: T): void;

  /**
   * Cause {@link operation} to raise `Error`. Any calling operation
   * waiting on `operation` will. Yielding to `operation` subsequently
   * will also raise the same error. * If either `resolve` or`reject`
   * has been called before, this will have no effect.
   *
   * @param error - the error to raise
   */
  reject(error: Error): void;
}

/**
 * Create an {link @Operation} and two functions to resolve or reject
 * it, corresponding to the two parameters passed to the executor of
 * the {@link action} constructor. This is the Effection equivalent of
 * [Promise.withResolvers()]{@link
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers}
 *
 * @returns an operation and its resolvers.
 * @since 3.2
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
