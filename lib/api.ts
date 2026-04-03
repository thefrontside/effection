// deno-lint-ignore-file ban-types
import type { Api, Context, Operation, Scope } from "./types.ts";
import { createApiInternal } from "./api-internal.ts";
import type { ScopeInternal } from "./scope-internal.ts";

/**
 * Create a new {@link Api}. This is the constructor behind
 * middleware decoration used through core such as with {@link Scope#around}.
 * One may implement an API around any operation or value and then decorate it per-scope.
 *
 * @example
 * ```ts
 * import { createApi, type Operation } from "effection/experimental";
 *
 * interface DatabaseApi {
 *   query(sql: string): Operation<{ id: number; title: string }[]>;
 * }
 *
 * // pass in the generic type or allow it to infer
 * let Database = createApi<DatabaseApi>("database", {
 *   *query(sql) {
 *     console.log("running", sql);
 *     return [];
 *   },
 * });
 * ```
 *
 * @param name - the API identifier used in error and debug messages
 * @param core - the core function/value implementations for this API
 * @returns an {@link Api} that can be invoked and decorated per-scope
 * @since 4.1
 */
export function createApi<A extends {}>(name: string, core: A): Api<A> {
  return createApiInternal(name, core);
}

interface ScopeApi {
  create(parent: Scope): [Scope, () => Operation<void>];
  destroy(scope: Scope): Operation<void>;
  set<T>(scope: Scope, context: Context<T>, value: T): T;
  delete<T>(scope: Scope, context: Context<T>): boolean;
}

interface MainApi {
  main(body: (args: string[]) => Operation<void>): Promise<void>;
}

interface Apis {
  Scope: Api<ScopeApi>;
  Main: Api<MainApi>;
}

/**
 * Built-in internal APIs used by Effection's runtime and host integration.
 * Advanced integrations can decorate these APIs in a scope.
 *
 * @example
 * ```ts
 * import { run, useScope } from "effection";
 * import { api } from "effection/experimental";
 *
 * await run(function* () {
 *   let scope = yield* useScope();
 *
 *   // Observe every scope creation in this scope subtree
 *   scope.around(api.Scope, {
 *     create(args, next) {
 *       console.log("creating scope");
 *       return next(...args);
 *     },
 *   });
 * });
 * ```
 *
 * @since 4.1
 */
export const api: Apis = {
  Scope: createApi<ScopeApi>("Scope", {
    create() {
      throw new TypeError(`no handler for Scope.create()`);
    },
    *destroy() {},
    set(scope, context, value) {
      return (scope as ScopeInternal).contexts[context.name] = value;
    },
    delete(scope, context) {
      return delete (scope as ScopeInternal).contexts[context.name];
    },
  }),
  Main: createApi<MainApi>("Main", {
    main() {
      throw new TypeError(`missing handler for "main()"`);
    },
  }),
};
