import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * Treat a promise as an {@link Operation}
 *
 * @example
 * ```js
 * let response = yield* until(fetch('https://google.com'));
 * ```
 * @template {T}
 * @param promise
 * @returns {Operation<T>} that succeeds or fails depending on the outcome of `promise`
 * @since 3.4
 */
export function until<T>(promise: Promise<T>): Operation<T> {
  return action((resolve, reject) => {
    promise.then(resolve).catch(reject);
    return () => {};
  });
}
