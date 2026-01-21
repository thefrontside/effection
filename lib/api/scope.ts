import { createApi } from "../api.ts";
import type { Api, Context, Future, Operation, Scope } from "../types.ts";

export interface ScopeApi {
  create(parent: Scope): [Scope, () => Future<void>];
  destroy(scope: Scope): Operation<void>;
  set<T>(contexts: Record<string, unknown>, context: Context<T>, value: T): T;
  delete<T>(contexts: Record<string, unknown>, context: Context<T>): boolean;
}

export default createApi<ScopeApi>("Scope", {
  create() {
    throw new TypeError(`no implementation for Scope.create()`);
  },
  *destroy() {},
  set(contexts, context, value) {
    return contexts[context.name] = value;
  },
  delete(contexts, context): boolean {
    return delete contexts[context.name];
  },
}) as Api<ScopeApi>;
