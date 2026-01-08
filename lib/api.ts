// deno-lint-ignore-file ban-types no-explicit-any
import { createContext } from "./mod.ts";
import { useScope } from "./scope.ts";
import type { Api, Operation } from "./types.ts";

export interface Middleware<TArgs extends unknown[], TReturn> {
  (args: TArgs, next: (...args: TArgs) => TReturn): TReturn;
}

export function createApi<A extends {}>(name: string, core: A): Api<A> {
  let fields = Object.keys(core) as (keyof A)[];

  let context = createContext(`api::${name}`) as Api<A>["context"];

  let api: Api<A> = {
    core,
    context,
    lookup: (scope) => {
      let cxt = scope?.get(context);
      if (!cxt) {
        return core;
      } else {
        return cxt.handle;
      }
    },
    *decorate(decorator, options = { at: "max" }) {
      let scope = yield* useScope();

      scope.decorate(api, decorator, options);
    },
    operations: fields.reduce((sum, field) => {
      if (typeof core[field] === "function") {
        return Object.assign(sum, {
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

/**
 * 1. no runtime cruft. If there is no middleware, invoke functions directly.
 * 2. Any api, including synchronous ones
 */
