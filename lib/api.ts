// deno-lint-ignore-file ban-types
import type { Api, Context, Operation, Scope } from "./types.ts";
import { createApiInternal } from "./api-internal.ts";
import type { ScopeInternal } from "./scope-internal.ts";

/**
 * Create an {@link Api} whose implementation can be decorated within a scope.
 *
 * The `core` implementation defines the API's default behavior. Use
 * {@link Api.around} or {@link Scope.around} to install middleware that changes
 * that behavior for a scope and its descendants.
 *
 * @example
 * ```ts
 * import { createApi } from "effection/experimental";
 * import type { Operation } from "effection";
 *
 * interface DatabaseApi {
 *   query(sql: string): Operation<{ id: number; title: string }[]>;
 * }
 *
 * let Database = createApi<DatabaseApi>("database", {
 *   *query(sql) {
 *     console.log("running", sql);
 *     return [];
 *   },
 * });
 *
 * export let { query } = Database.operations;
 * ```
 *
 * @template A - the shape of the API's core implementation
 * @param name - the API identifier used in debug messages
 * @param core - the default implementation for every API member
 * @returns an API that can be invoked and decorated per scope
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

interface Apis {
  Scope: Api<ScopeApi>;
}

/**
 * Built-in APIs used by Effection's runtime and host integrations.
 *
 * Advanced integrations can decorate these APIs to observe or modify runtime
 * behavior within a scope.
 *
 * @example
 * ```ts
 * import { main, useScope } from "effection";
 * import { api } from "effection/experimental";
 *
 * await main(function* () {
 *   let scope = yield* useScope();
 *
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
    destroy(scope) {
      return (scope as ScopeInternal).destroy();
    },
    set(scope, context, value) {
      return (scope as ScopeInternal).contexts[context.name] = value;
    },
    delete(scope, context) {
      return delete (scope as ScopeInternal).contexts[context.name];
    },
  }),
};
