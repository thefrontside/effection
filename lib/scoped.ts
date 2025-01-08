import type { Operation } from "./types.ts";
import { trap } from "./task.ts";
import { createScopeInternal } from "./scope.ts";
import { useCoroutine } from "./coroutine.ts";

/**
 * Encapsulate an operation so that no effects will persist outside of
 * it. All active effects such as concurrent tasks and resources will be
 * shut down, and all contexts will be restored to their values outside
 * of the scope.
 *
 * @example
 * ```js
 * import { useAbortSignal } from "effection";

 * function* example() {
 *   let signal = yield* scoped(function*() {
 *     return yield* useAbortSignal();
 *   });
 *   return signal.aborted; //=> true
 * }
 * ```
 *
 * @param operation - the operation to be encapsulated
 *
 * @returns the scoped operation
 */
export function scoped<T>(operation: () => Operation<T>): Operation<T> {
  return {
    *[Symbol.iterator]() {
      let routine = yield* useCoroutine();
      let original = routine.scope;
      let [scope, destroy] = createScopeInternal(original);
      try {
        routine.scope = scope;
        return yield* trap(operation);
      } finally {
        routine.scope = original;
        yield* destroy();
      }
    },
  };
}
