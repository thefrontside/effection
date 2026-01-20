// deno-lint-ignore-file ban-types
import { createContext } from "./context.ts";
import { useScope } from "./scope.ts";
import type { Api, Decorate, Operation, Scope } from "./types.ts";
import type { ScopeInternal } from "./scope-internal.ts";

export interface Middleware<TArgs extends unknown[], TReturn> {
  (args: TArgs, next: (...args: TArgs) => TReturn): TReturn;
}

export function createApi<A extends {}>(name: string, core: A): Api<A> {
  let fields = Object.keys(core) as (keyof A)[];

  let context = createContext(`api::${name}`) as Api<A>["context"];

  let api: Api<A> = {
    core,
    context,
    lookup: (scope) => createHandle(api, scope),
    decorate: (decorator, options = { at: "max" }) => ({
      *[Symbol.iterator]() {
        let scope = yield* useScope();
        scope.decorate(api, decorator, options);
      },
    }),
    operations: fields.reduce((sum, field) => {
      if (typeof core[field] === "function") {
        return Object.assign(sum, {
          // deno-lint-ignore no-explicit-any
          [field]: (...args: any[]) => ({
            *[Symbol.iterator]() {
              let scope = yield* useScope();
              let handle = api.lookup(scope);
              let handler = handle[field] as Function;
              let target = handler(...args);
              return isOperation(target) ? yield* target : target;
            },
          }),
        });
      } else {
        return Object.assign(sum, {
          [field]: {
            *[Symbol.iterator]() {
              let scope = yield* useScope();
              let handle = api.lookup(scope);
              let target = handle[field];
              return isOperation(target) ? yield* target : target;
            },
          },
        });
      }
    }, {} as Api<A>["operations"]),
  };
  return api;
}

function createHandle<A extends {}>(api: Api<A>, scope: Scope): A {
  let handle = Object.create(api.core);
  let $scope = scope as ScopeInternal;
  for (let key of Object.keys(api.core) as Array<keyof A>) {
    let dispatch = (args: unknown[], next: (...args: unknown[]) => unknown) => {
      let { min, max } = $scope.reduce(api.context, (sum, current) => {
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
        min: [] as Decorate<A>[typeof key][],
        max: [] as Decorate<A>[typeof key][],
      });

      let stack = combine(max.concat(min) as Middleware<unknown[], unknown>[]);
      return stack(args, next);
    };

    if (typeof api.core[key] === "function") {
      handle[key] = (...args: unknown[]) =>
        dispatch(args, api.core[key] as (...args: unknown[]) => unknown);
    } else {
      Object.defineProperty(handle, key, {
        enumerable: true,
        get() {
          return dispatch([], () => api.core[key]);
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
