import { Err, Ok } from "./result.ts";
import type { Effect, Operation } from "./types.ts";

/**
 * A function used to define how an {@link action} will be resolved. This
 * function is passed two arguments: a `resolve` callback used to resolve
 * the action with a value and a `reject` callback used to reject the
 * action with a provided error.
 *
 * @param executor - the function to run whenever an action is evaluated.
 * @return a "finally" function that is _always_ run whether the
 *           action is resolved, rejected, or discarded.
 */
interface Executor<T> {
  (resolve: (value: T) => void, reject: (error: Error) => void): () => void;
}

/**
 * Create an {@link Operation} that can be either resolved (or
 * rejected) with a synchronous callback. This is the Effection
 * equivalent of `new Promise()`. Actions are stateless and so unlike
 * the `new Promise()` executor function, the action executor is
 * called every time that an action is evaluated.
 *
 * The resolver must return a "finally" function that will _always_ be
 * called regardless of whether the action was resolved or rejected,
 * or discarded.
 *
 * @example
 *
 * ```js
 * let five = yield* action((resolve, reject) => {
 *   let timeout = setTimeout(() => {
 *     if (Math.random() > 5) {
 *       resolve(5)
 *     } else {
 *       reject(new Error("bad luck!"));
 *     }
 *   }, 1000);
 *   return () => clearTimeout(timeout);
 * });
 * ```
 *
 * @param executor - a function called every time that an action is evaluated
 * @return an operation that will run according to `executor` every time it is evaluated
 * @since 3.0
 */
export function action<T>(executor: Executor<T>, desc?: string): Operation<T> {
  return {
    *[Symbol.iterator]() {
      let action: Effect<T> = {
        description: desc ?? "action",
        enter: (settle) => {
          let resolve = (value: T) => {
            settle(Ok(value));
          };
          let reject = (error: Error) => {
            settle(Err(error));
          };
          let discard = executor(resolve, reject);
          return (discarded) => {
            try {
              discard();
              discarded(Ok());
            } catch (error) {
              discarded(Err(error as Error));
            }
          };
        },
      };
      return (yield action) as T;
    },
  };
}
