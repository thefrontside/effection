// deno-lint-ignore-file ban-types no-explicit-any
import { createContext } from "./context.ts";
import type {
  Api,
  Around,
  Context,
  Effect,
  Middleware,
  Operation,
  Scope,
} from "./types.ts";
import type { ScopeInternal } from "./scope-internal.ts";
import { Children } from "./contexts.ts";
import { Ok } from "./result.ts";

export interface ApiInternal<A> extends Api<A> {
  context: Context<{
    max: Partial<Around<A>>[];
    min: Partial<Around<A>>[];
  }>;
  core: A;
  cacheKey: string;
  invalidate(scope: Scope): void;
}

export function createApiInternal<A extends {}>(
  name: string,
  core: A,
): ApiInternal<A> {
  let fields = Object.keys(core) as (keyof A)[];

  let context = createContext(`api::${name}`) as ApiInternal<A>["context"];

  let cacheKey = `${context.name}::cache`;

  let api: ApiInternal<A> = {
    core,
    context,
    cacheKey,
    invalidate(scope: Scope) {
      delete (scope as ScopeInternal).contexts[cacheKey];
      let children = scope.get(Children);
      if (children) {
        for (let child of children) {
          api.invalidate(child);
        }
      }
    },
    invoke: (scope, key, args) => {
      let contexts = (scope as ScopeInternal).contexts;
      let handle = Object.hasOwn(contexts, cacheKey)
        ? contexts[cacheKey] as A
        : undefined;
      if (!handle) {
        handle = createHandle(api, scope as ScopeInternal);
        contexts[cacheKey] = handle;
      }
      let member = handle[key];
      if (typeof member === "function") {
        return member(...args);
      } else {
        return member;
      }
    },
    around: (decorator, options = { at: "max" }) => ({
      *[Symbol.iterator]() {
        let scope = (yield GetScope) as Scope;
        scope.around(api, decorator, options);
      },
    }),
    operations: fields.reduce((sum, field) => {
      if (typeof core[field] === "function") {
        return Object.assign(sum, {
          [field]: (...args: any) => ({
            *[Symbol.iterator]() {
              let scope = (yield GetScope) as Scope;
              let target = api.invoke(scope, field, args);

              return isOperation(target) ? yield* target : target;
            },
          }),
        });
      } else {
        return Object.assign(sum, {
          [field]: {
            *[Symbol.iterator]() {
              let scope = (yield GetScope) as Scope;
              let target = api.invoke(scope, field, [] as any);
              return isOperation(target) ? yield* target : target;
            },
          },
        });
      }
    }, {} as Api<A>["operations"]),
  };
  return api;
}

function createHandle<A extends {}>(
  api: ApiInternal<A>,
  scope: ScopeInternal,
): A {
  // there is no middleware at all for this api, so the handle _is_ the core.
  if (!scope.get(api.context)) {
    return api.core;
  }

  let handle = Object.create(api.core);

  for (let key of Object.keys(api.core) as Array<keyof A>) {
    let { min, max } = scope.reduce(api.context, (sum, current) => {
      let min = current.min.flatMap((around) =>
        around[key] ? [around[key]] : []
      );
      let max = current.max.flatMap((around) =>
        around[key] ? [around[key]] : []
      );

      sum.min.push(...min);
      sum.max.unshift(...max);

      return sum;
    }, {
      min: [] as Around<A>[typeof key][],
      max: [] as Around<A>[typeof key][],
    });

    let stack = combine(max.concat(min) as Middleware<unknown[], unknown>[]);

    if (typeof api.core[key] === "function") {
      handle[key] = (...args: unknown[]) =>
        stack(args, api.core[key] as (...args: unknown[]) => unknown);
    } else {
      Object.defineProperty(handle, key, {
        enumerable: true,
        get() {
          return stack([], () => api.core[key]);
        },
      });
    }
  }

  return handle;
}

function isOperation<T>(
  target: Operation<T> | T,
): target is Operation<T> {
  return target && !isNativeIterable(target) &&
    typeof (target as Operation<T>)[Symbol.iterator] === "function";
}

function isNativeIterable(target: unknown): boolean {
  return (
    typeof target === "string" || Array.isArray(target) ||
    target instanceof Map || target instanceof Set
  );
}

function combine<TArgs extends unknown[], TReturn>(
  middlewares: Middleware<TArgs, TReturn>[],
): Middleware<TArgs, TReturn> {
  if (middlewares.length === 0) {
    return (args, next) => next(...args);
  }
  return middlewares.reduceRight((sum, middleware) => (args, next) =>
    middleware(args, (...args) => sum(args, next))
  );
}

const GetScope: Effect<Scope> = {
  description: "Fast, non-typesafe lookup of co-routine scope",
  enter: (resolve, routine) => {
    resolve(Ok(routine.scope));
    return (didExit) => didExit(Ok());
  },
};
