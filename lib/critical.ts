import { Shielded } from "./contexts.ts";
import type { Operation } from "./types.ts";

/**
 * Mark a block as cancellation-shielded.
 *
 * In v4.x, `critical()` is primarily a marker on the scope: yields
 * inside it set `Shielded` to `true`, which tooling (such as the
 * dev-mode swallowed-return warning) reads to know the work is
 * cleanup-after-halt that the author intends to complete.
 *
 * In v5, `critical()` becomes load-bearing: yields outside `critical()`
 * whose containing scope is `Cancelled` will short-circuit, while
 * yields inside `critical()` continue to run. This lets a `finally`
 * block reliably finish cleanup that involves async work.
 *
 * @example
 * ```js
 * function* useResource() {
 *   let handle = openHandle();
 *   try {
 *     yield* provide(handle);
 *   } finally {
 *     yield* critical(function*() {
 *       yield* handle.flush();
 *       yield* handle.close();
 *     });
 *   }
 * }
 * ```
 *
 * @param op - the operation to run with cancellation shielding
 * @returns the result of `op`
 * @since 4.1
 */
export function critical<T>(op: () => Operation<T>): Operation<T> {
  return Shielded.with(true, () => op());
}
