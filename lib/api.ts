// deno-lint-ignore-file ban-types
import type { Api, Context, Operation, Scope } from "./types.ts";
import { createApiInternal } from "./api-internal.ts";
import type { ScopeInternal } from "./scope-internal.ts";

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
};
