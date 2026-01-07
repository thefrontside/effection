// deno-lint-ignore-file ban-types no-explicit-any
import { useScope } from "./scope.ts";
import type { ScopeInternal } from "./scope-internal.ts";
import type { Operation, Scope } from "./types.ts";

export interface Middleware<TArgs extends unknown[], TReturn> {
  (args: TArgs, next: (...args: TArgs) => TReturn): TReturn;
}

export interface Api<A> {
  lookup: (scope: Scope) => A;
  operations: {
    [K in keyof A]: A[K] extends Operation<unknown> ? A[K]
      : A[K] extends (...args: infer TArgs) => infer TReturn
        ? TReturn extends Operation<unknown> ? A[K]
        : (...args: TArgs) => Operation<TReturn>
      : Operation<A[K]>;
  };
  decorate: (
    decorate: Partial<Decorate<A>>,
    options?: DecorateOptions,
  ) => Operation<void>;
}

export interface DecorateOptions {
  at: "min" | "max";
}

export type Decorate<Api> = {
  [K in keyof Api]: Api[K] extends (...args: infer TArgs) => infer TReturn
    ? Middleware<TArgs, TReturn>
    : Middleware<[], Api[K]>;
};

export function createApi<A extends {}>(name: string, core: A): Api<A> {
  let fields = Object.keys(core) as (keyof A)[];

  let contextName = `$api:${name}`;

  let api: Api<A> = {
    lookup: (scope) => {
      let internal = scope as ScopeInternal;
      let cxt = internal.contexts[contextName] as ApiContext<A>;
      if (!cxt) {
        return core;
      } else {
        return cxt.handle;
      }
    },
    *decorate(decorator, options = { at: "max" }) {
      let cxt = yield* getContextInternal<ApiContext<A>>(contextName);
      let min = cxt?.min.slice() ?? [];
      let max = cxt?.max.slice() ?? [];

      if (options.at === "min") {
        min.push(decorator);
      } else {
        max.push(decorator);
      }

      let decorators = merge(max, min);

      let handle = fields.reduce((sum, field) => {
        let decorator = decorators[field] as Function | undefined;
        if (!decorator) {
          return sum;
        }
        let target = sum === core ? { ...core } : sum;
        if (typeof core[field] === "function") {
          Object.assign(target, {
            [field]: (...args: any[]) => decorator(args, core[field]),
          });
        } else {
          Object.defineProperty(target, field, {
            enumerable: true,
            get: () => decorator([], () => core[field]),
          });
        }
        return target;
      }, core);

      yield* setContextInternal<ApiContext<A>>(contextName, {
        min,
        max,
        handle,
      });
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

interface ApiContext<A> {
  min: Partial<Decorate<A>>[];
  max: Partial<Decorate<A>>[];
  handle: A;
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

function merge<A>(
  max: Partial<Decorate<A>>[],
  min: Partial<Decorate<A>>[],
): Partial<Decorate<A>> {
  let stacks = {} as Partial<
    {
      [K in keyof A]: Decorate<A>[K][];
    }
  >;

  for (let decorator of max.concat(min)) {
    let fields = Object.keys(decorator) as Array<keyof A>;
    for (let field of fields) {
      let middleware = decorator[field]!;
      let current = stacks[field];
      if (!current) {
        stacks[field] = [middleware];
      } else {
        current.push(middleware);
      }
    }
  }

  let fields = Object.keys(stacks) as Array<keyof A>;

  return fields.reduce((merged, field) => {
    let stack = stacks[field]!;
    return Object.assign(merged, {
      [field]: combine(stack as any[]),
    });
  }, {} as Partial<Decorate<A>>);
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

function* getContextInternal<T>(name: string): Operation<T | undefined> {
  let scope = (yield* useScope()) as ScopeInternal;
  return scope.contexts[name] as T | undefined;
}

function* setContextInternal<T>(name: string, value: T): Operation<void> {
  let scope = (yield* useScope()) as ScopeInternal;
  scope.contexts[name] = value;
}

/**
 * 1. no runtime cruft. If there is no middleware, invoke functions directly.
 * 2. Any api, including synchronous ones
 */
