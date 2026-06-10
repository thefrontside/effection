import type { Operation } from "./types.ts";
import { Trap, trap } from "./trap.ts";
import { critical, useCoroutine } from "./coroutine.ts";
import { createScopeInternal } from "./scope-internal.ts";
import { Just } from "./maybe.ts";
import { Err, Ok } from "./result.ts";

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
 * @since 3.2
 */
export function scoped<T>(operation: () => Operation<T>): Operation<T> {
  return {
    [Symbol.iterator]: function* scoped() {
      let routine = yield* useCoroutine();
      let original = routine.scope;
      let [scope, destroy] = createScopeInternal(original);
      let t = new Trap<T>(routine);
      try {
        routine.scope = scope;
        t.outcome = Just(Ok(yield* trap(operation)));
      } catch (error) {
        t.outcome = Just(Err(error as Error));
      } finally {
        routine.scope = original;
        yield* critical(destroy);
        // deno-lint-ignore no-unsafe-finally
        return (yield t.exit()) as T;
      }
    },
  };
}
