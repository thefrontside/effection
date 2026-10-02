import type { Operation, RequirementsOf, Yielded } from "./types.ts";
import { Trap, trap } from "./trap.ts";
import { critical, useCoroutine } from "./coroutine.ts";
import { createScopeInternal } from "./scope-internal.ts";
import { Just } from "./maybe.ts";
import { Err, Ok } from "./result.ts";
import type { Result } from "./result.ts";

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
export function scoped<Child extends Operation<unknown, unknown>>(
  operation: () => Child,
): Operation<Yielded<Child>, RequirementsOf<Child>> {
  return {
    [Symbol.iterator]: function* scoped() {
      let routine = yield* useCoroutine();
      let original = routine.scope;
      let [scope, destroy] = createScopeInternal(original);
      let t = new Trap<Yielded<Child>>(routine);
      try {
        routine.scope = scope;
        t.outcome = Just(Ok(yield* trap(operation)) as Result<Yielded<Child>>);
      } catch (error) {
        t.outcome = Just(Err(error));
      } finally {
        routine.scope = original;
        yield* critical(destroy);
        // deno-lint-ignore no-unsafe-finally
        return (yield t.exit()) as Yielded<Child>;
      }
    },
  } as Operation<Yielded<Child>, RequirementsOf<Child>>;
}
