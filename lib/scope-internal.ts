// deno-lint-ignore-file ban-types
import { Children, Priority } from "./contexts.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";
import type {
  Api,
  Context,
  Decorate,
  DecorateOptions,
  Middleware,
  Operation,
  Scope,
  Task,
} from "./types.ts";
import { type WithResolvers, withResolvers } from "./with-resolvers.ts";

import api from "./api/scope.ts";
import { createCoroutine } from "./coroutine.ts";
import { box } from "./box.ts";

export function createScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  let destructors = new Set<() => Operation<void>>();

  let { init } = api.lookup(parent);

  let contexts = init((parent as ScopeInternal)?.contexts);

  let scope: ScopeInternal = Object.create({
    [Symbol.toStringTag]: "Scope",
    contexts,
    get<T>(context: Context<T>): T | undefined {
      return (contexts[context.name] ?? context.defaultValue) as T | undefined;
    },
    set<T>(context: Context<T>, value: T): T {
      return api.lookup(scope).set(contexts, context, value);
    },
    expect<T>(context: Context<T>): T {
      let value = scope.get(context);
      if (typeof value === "undefined") {
        let error = new Error(context.name);
        error.name = `MissingContextError`;
        throw error;
      }
      return value;
    },
    delete<T>(context: Context<T>): boolean {
      return api.lookup(scope).delete(contexts, context);
    },
    hasOwn<T>(context: Context<T>): boolean {
      return !!Reflect.getOwnPropertyDescriptor(contexts, context.name);
    },
    run<T>(operation: () => Operation<T>): Task<T> {
      let { task, start } = createTask({ operation, owner: scope });
      start();
      return task;
    },
    spawn<T>(operation: () => Operation<T>): Operation<Task<T>> {
      return {
        *[Symbol.iterator]() {
          let { task, start } = createTask({ operation, owner: scope });
          start();
          return task;
        },
      };
    },

    eval<T>(operation: () => Operation<T>): Operation<T> {
      return {
        *[Symbol.iterator]() {
          let { resolve, reject, operation: result } = withResolvers<T>();
          let routine = createCoroutine({
            scope,
            operation: function* evaluate() {
              try {
                let value = yield* operation();
                resolve(value);
              } catch (error) {
                reject(error as Error);
              }
            },
          });

          routine.next(Ok());

          try {
            return yield* result;
          } finally {
            routine.return(Ok({ exists: false }));
            // deno-lint-ignore no-unsafe-finally
            return yield* result;
          }
        },
      };
    },

    decorate<T extends {}>(
      api: Api<T>,
      decorator: Partial<Decorate<T>>,
      options: DecorateOptions,
    ) {
      let cxt = scope.get(api.context);
      let min = cxt?.min.slice() ?? [];
      let max = cxt?.max.slice() ?? [];

      let { core } = api;

      let fields = Object.keys(api.core) as Array<keyof T>;

      if (options.at === "min") {
        min.push(decorator);
      } else {
        max.push(decorator);
      }

      let decorators = mergeDecorators(max, min);

      let handle = fields.reduce((sum, field) => {
        let decorator = decorators[field] as Function | undefined;
        if (!decorator) {
          return sum;
        }
        let target = sum === core ? { ...core } : sum;
        if (typeof core[field] === "function") {
          Object.assign(target, {
            // deno-lint-ignore no-explicit-any
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

      scope.set(api.context, { min, max, handle });
    },

    ensure(op: () => Operation<void>): () => void {
      destructors.add(op);
      return () => destructors.delete(op);
    },
  });

  scope.set(Priority, scope.expect(Priority) + 1);
  scope.set(Children, new Set());
  parent?.expect(Children).add(scope);

  let unbind = parent ? (parent as ScopeInternal).ensure(destroy) : () => {};

  let destruction: WithResolvers<void> | undefined = undefined;

  function* destroy(): Operation<void> {
    if (destruction) {
      return yield* destruction.operation;
    }
    destruction = withResolvers<void>();
    parent?.expect(Children).delete(scope);
    unbind();
    let outcome = Ok();
    try {
      for (let destructor of destructors) {
        try {
          destructors.delete(destructor);
          yield* destructor();
        } catch (error) {
          outcome = Err(error as Error);
        }
      }
    } finally {
      if (outcome.ok) {
        destruction.resolve();
      } else {
        destruction.reject(outcome.error);
      }
    }

    unbox(outcome);
  }

  return [scope, destroy];
}

export interface ScopeInternal extends Scope {
  contexts: Record<string, unknown>;
  ensure(op: () => Operation<void>): () => void;
}

function mergeDecorators<A>(
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
      // deno-lint-ignore no-explicit-any
      [field]: combineDecorators(stack as any[]),
    });
  }, {} as Partial<Decorate<A>>);
}

function combineDecorators<TArgs extends unknown[], TReturn>(
  middlewares: Middleware<TArgs, TReturn>[],
): Middleware<TArgs, TReturn> {
  if (middlewares.length === 0) {
    return (args, next) => next(...args);
  }
  return middlewares.reduceRight((sum, middleware) => (args, next) =>
    middleware(args, (...args) => sum(args, next))
  );
}
