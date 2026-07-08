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
import { Children } from "./contexts.ts";
import { Ok } from "./result.ts";

export interface ApiInternal<A> extends Api<A> {
  context: Context<{
    local: Decorator<A>;
    total: Decorator<A>;
    handle: A;
  }>;
  core: A;
}

export function createApiInternal<A extends {}>(
  name: string,
  core: A,
): ApiInternal<A> {
  let fields = Object.keys(core) as (keyof A)[];

  let context = createContext(`api::${name}`) as ApiInternal<A>["context"];

  let api: ApiInternal<A> = {
    core,
    context,

    invoke: (scope, key, args) => {
      let handle = scope.get(api.context)?.handle ?? core;

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
        decorateApi(scope, api, decorator, options);
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

export function decorateApi<A>(
  scope: Scope,
  api: ApiInternal<A>,
  decorator: Partial<Around<A>>,
  options?: {
    at: "min" | "max";
  },
) {
  // read existing total and local
  let current = scope.get(api.context) ?? { total: {}, local: {} };

  let local = decorate(current.local, {
    [options?.at ?? "max"]: decorator,
  });

  if (!scope.hasOwn(api.context)) {
    scope.set(api.context, {
      local,
      total: current.total,
      handle: api.core,
    });
  } else {
    current.local = local;
  }

  install(scope, api, current.total);
}

function decorate<A>(base: Decorator<A>, next: Decorator<A>): Decorator<A> {
  return {
    max: base.max ? next.max ? append(base.max, next.max) : base.max : next.max,
    min: next.min ? base.min ? append(next.min, base.min) : next.min : base.min,
  };
}

function append<A>(
  outer: Partial<Around<A>>,
  inner: Partial<Around<A>>,
): Partial<Around<A>> {
  let result: Partial<Around<A>> = { ...outer };
  for (let key of Object.keys(inner) as (keyof A)[]) {
    let current = outer[key];
    let decoration = inner[key];
    if (!current) {
      result[key] = decoration;
    } else {
      let pair = [current, decoration] as Middleware<unknown[], unknown>[];
      result[key] = combine(pair) as Around<A>[keyof A];
    }
  }
  return result;
}

function install<A>(
  scope: Scope,
  api: ApiInternal<A>,
  total: Decorator<A>,
): void {
  if (scope.hasOwn(api.context)) {
    let context = scope.expect(api.context);

    context.total = total;

    total = decorate(context.total, context.local);

    context.handle = createApiHandle(total, api.core);
  }

  for (let child of scope.expect(Children)) {
    install(child, api, total);
  }
}

function createApiHandle<A>(decoration: Decorator<A>, core: A): A {
  let around = decoration.max
    ? decoration.min ? append(decoration.max, decoration.min) : decoration.max
    : decoration.min;
  if (!around) {
    return core;
  }
  let handle: A = {} as A;
  for (let key of Object.keys(core as object) as Array<keyof A>) {
    let middleware = around[key] as Middleware<unknown[], unknown> | undefined;
    if (middleware) {
      if (typeof core[key] === "function") {
        handle[key] = ((...args: unknown[]) =>
          middleware(args, core[key] as (...args: unknown[]) => unknown)) as A[
            keyof A
          ];
      } else {
        Object.defineProperty(handle, key, {
          enumerable: true,
          get() {
            return middleware([], () => core[key]);
          },
        });
      }
    } else {
      handle[key] = core[key];
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

interface Decorator<A> {
  min?: Partial<Around<A>>;
  max?: Partial<Around<A>>;
}

const GetScope: Effect<Scope> = {
  description: "Fast, non-typesafe lookup of co-routine scope",
  enter: (resolve, routine) => {
    resolve(Ok(routine.scope));
    return (didExit) => didExit(Ok());
  },
};
