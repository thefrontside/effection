import type { Effect, Future, Operation, Scope } from "./types.ts";
import { Ok } from "./result.ts";
import { createScopeInternal } from "./scope-internal.ts";

/**
 * The root of all Effection Scopes.
 * @since 4.0
 */
export const global = createScopeInternal()[0] as Scope;

/**
 * Create a new {@link Scope} as a child of `parent`, inheriting all its contexts.
 * along with a method to destroy the scope. Whenever the scope is destroyd, all
 * tasks and resources it contains will be halted.
 *
 * This function is used mostly by frameworks as an intergration point to enter
 * Effection.
 *
 * @example
 * ```js
 * import { createScope, sleep, suspend } from "effection";
 *
 * let [scope, destroy] = createScope();
 *
 * let delay = scope.run(function*() {
 *   yield* sleep(1000);
 * });
 * scope.run(function*() {
 *   try {
 *     yield* suspend();
 *    } finally {
 *      console.log('done!');
 *    }
 * });
 * await delay;
 * await destroy(); // prints "done!";
 * ```
 *
 * `createScope()` also supports explicit resource management
 * @example
 * ```js
 * {
 *  await using scope = createScope();
 *
 *  let delay = scope.run(function*() {
 *    yield* sleep(1000);
 *  });
 *
 *  scope.run(function*() {
 *    try {
 *      yield* suspend();
 *    } finally {
 *      console.log('done!');
 *    }
 *  });
 *
 *  await delay;
 *  // prints "done!";
 * }
 * ```
 *
 * @param parent scope. If no parent is specified it will derive directly from {@link global}
 * @returns a tuple containing the freshly created scope, along with a function to
 *          destroy it.
 * @since 3.0
 */
export function createScope(
  parent: Scope = global,
): Scope & AsyncDisposable & [Scope, () => Future<void>] {
  let [scope, destroy] = createScopeInternal(parent);
  let dispose = () => parent.run(destroy);

  let tuple = [scope, dispose];

  Object.defineProperty(scope, Symbol.iterator, {
    value: tuple[Symbol.iterator].bind(tuple),
    enumerable: false,
  });

  Object.defineProperty(scope, Symbol.asyncDispose, {
    enumerable: false,
    value: dispose,
  });

  return scope as unknown as
    & Scope
    & AsyncDisposable
    & [Scope, () => Future<void>];
}

/**
 * Get the scope of the currently running {@link Operation}.
 *
 * @returns an operation yielding the current scope
 * @since 3.0
 */
export function* useScope(): Operation<Scope> {
  return (yield {
    description: `useScope()`,
    enter(resolve, { scope }) {
      resolve(Ok(scope));
      return (resolve) => resolve(Ok());
    },
  } as Effect<Scope>) as Scope;
}
