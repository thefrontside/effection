// deno-lint-ignore-file ban-types
import { Children, Priority } from "./contexts.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";
import type {
  Api,
  Context,
  Decorate,
  DecorateOptions,
  Operation,
  Scope,
  Task,
} from "./types.ts";
import { type WithResolvers, withResolvers } from "./with-resolvers.ts";

import api from "./api/scope.ts";
import { createCoroutine } from "./coroutine.ts";

export function createScopeInternal(parent?: Scope): [ScopeInternal, () => Operation<void>] {
  if (!parent) {
    let [global, destroy] = buildScopeInternal();
    global.decorate(api, {
      create([parent]) {
        return buildScopeInternal(parent);
      },
    }, { at: "min" });
    return [global, destroy] as const;
  } else {
    return api.lookup(parent).create(parent) as [
      ScopeInternal,
      () => Operation<void>,
    ];
  }
}

function buildScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  let destructors = new Set<() => Operation<void>>();

  let contexts = Object.create(
    parent ? (parent as ScopeInternal).contexts : null,
  );

  let scope: ScopeInternal = Object.create({
    [Symbol.toStringTag]: "Scope",
    contexts,
    get<T>(context: Context<T>): T | undefined {
      return (contexts[context.name] ?? context.defaultValue) as T | undefined;
    },
    super<T>(context: Context<T>): T | undefined {
      return parent?.get(context);
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

    decorate<T extends {}>(
      api: Api<T>,
      decorator: Partial<Decorate<T>>,
      options?: DecorateOptions,
    ) {
      if (!scope.hasOwn(api.context)) {
        scope.set(api.context, { min: [], max: [] });
      }

      let { min, max } = scope.expect(api.context);

      if (options?.at === "min") {
        min.push(decorator);
      } else {
        max.push(decorator);
      }
    },

    ensure(op: () => Operation<void>): () => void {
      destructors.add(op);
      return () => destructors.delete(op);
    },

    reduce<T, S>(
      context: Context<T>,
      fn: (sum: S, item: T) => S,
      initial: S,
    ): S {
      let sum = initial;
      let current = contexts;
      while (current) {
        if (Object.hasOwn(current, context.name)) {
          let item = current[context.name] as T;
          if (item) {
            sum = fn(sum, item);
          }
        }

        current = Object.getPrototypeOf(current);
      }
      return sum;
    },
  });

  scope.set(Priority, scope.expect(Priority) + 1);
  scope.set(Children, new Set());
  parent?.expect(Children).add(scope);

  let destroy = () => api.lookup(scope).destroy(scope);

  let unbind = parent ? (parent as ScopeInternal).ensure(destroy) : () => {};

  let destruction: WithResolvers<void> | undefined = undefined;

  scope.decorate(api, {
    *destroy() {
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
    },
  }, { at: "min" });

  return [scope, destroy];
}

export interface ScopeInternal extends Scope {
  contexts: Record<string, unknown>;
  reduce<T, S>(context: Context<T>, fn: (sum: S, item: T) => S, initial: S): S;
  ensure(op: () => Operation<void>): () => void;
}
