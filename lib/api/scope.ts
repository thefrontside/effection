import { createApi } from "../api.ts";
import type { Api, Context } from "../types.ts";

export interface ScopeApi {
  init(parent?: Record<string, unknown>): Record<string, unknown>;
  set<T>(contexts: Record<string, unknown>, context: Context<T>, value: T): T;
  delete<T>(contexts: Record<string, unknown>, context: Context<T>): boolean;
}

export default createApi<ScopeApi>("Scope", {
  init(parent) {
    return Object.create(parent ?? null);
  },
  set(contexts, context, value) {
    return contexts[context.name] = value;
  },
  delete(contexts, context): boolean {
    return delete contexts[context.name];
  },
}) as Api<ScopeApi>;
