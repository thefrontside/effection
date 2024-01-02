import type { Context, Frame, Future, Operation, Scope } from "../types.ts";
import { evaluate } from "../deps.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";

/**
 * Get the scope of the currently running {@link Operation}.
 *
 * @returns an operation yielding the current scope
 */
export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  let [scope] = createScope(frame);
  return scope;
}

/**
 * Create a new scope to serve as an entry point from normal
 * JavaScript execution into Effection.
 *
 * When creating a fresh scope (as opposed to capturing a reference to
 * an existing one via {@link useScope}) it is the responsibility of
 * the creator of the new scope to destroy it when it is no longer needed.
 *
 * @example
 * ```javascript
 * let [scope, destroy] = createScope();
 * let task = scope.run(function*() {
 *   //do some long running work
 * });
 *
 * //... later
 * await destroy();
 *
 * ```
 * @returns a tuple containing the new scope, and a function to destroy it.
 */
export function createScope(frame?: Frame): [Scope, () => Future<void>] {
  let parent = frame ?? createFrame({ operation: suspend });

  let scope = create<Scope>("Scope", {}, {
    run<T>(operation: () => Operation<T>) {
      if (parent.exited) {
        let error = new Error(
          `cannot call run() on a scope that has already been exited`,
        );
        error.name = "InactiveScopeError";
        throw error;
      }

      let frame = parent.createChild(operation);
      frame.enter();

      evaluate(function* () {
        let result = yield* frame;
        if (!result.ok) {
          yield* parent.crash(result.error);
        }
      });

      return frame.getTask();
    },
    get<T>(context: Context<T>) {
      let { key, defaultValue } = context;
      return (parent.context[key] ?? defaultValue) as T | undefined;
    },
    set<T>(context: Context<T>, value: T) {
      let { key } = context;
      parent.context[key] = value;
      return value;
    },
  });

  parent.enter();

  return [scope, parent.getTask().halt];
}
