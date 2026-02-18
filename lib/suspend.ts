import { action } from "./action.ts";
import type { Operation } from "./types.ts";

/**
 * Indefinitely pause execution of the current operation.
 *
 * A suspended operation will remain paused until its enclosing scope
 * is destroyed, at which point it proceeds as though return had been
 * called from the point of suspension.
 *
 * @example
 * ```js
 * import { main, suspend } from "effection";
 *
 * await main(function* (resolve) {
 *   try {
 *     console.log('suspending');
 *     yield* suspend();
 *   } finally {
 *     console.log('done!');
 *   }
 * });
 * ```
 *
 * @returns an operation that suspends the current operation
 * @since 3.0
 */
export function suspend(): Operation<void> {
  return action(() => () => {}, "suspend");
}
