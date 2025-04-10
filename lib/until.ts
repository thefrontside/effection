import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * It can be used to treat a promise as an operation. This function
 * is a replacement to the v3 deprecated `call(promise)` function form.
 *
 * @example
 * ```js
 * let response = yield* until(fetch('https://google.com'));
 * ```
 * @template {T}
 * @param promise
 * @returns {Operation<T>}
 */
export function until<T>(promise: Promise<T>): Operation<T> {
  return action((resolve, reject) => {
    promise.then(resolve).catch(reject);
    return () => {};
  });
}
