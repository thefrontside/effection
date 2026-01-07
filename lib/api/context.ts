import { type Api, createApi } from "../api.ts";
import type { ScopeInternal } from "../scope-internal.ts";
import type { Context, Scope } from "../types.ts";

export interface ContextApi {
  set<T>(scope: Scope, context: Context<T>, value: T): T;
}

export default createApi("Context", {
  set<T>(scope: Scope, context: Context<T>, value: T): T {
    let { contexts } = scope as ScopeInternal;
    return contexts[context.name] = value;
  },
}) as Api<ContextApi>;
