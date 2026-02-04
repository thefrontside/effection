import type { ApiInternal } from "./api-internal.ts";
import { api as effection } from "./api.ts";
import { Children, Priority } from "./contexts.ts";
import { createFuture } from "./future.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";

import type { Context, Operation, Scope, Task } from "./types.ts";

const api = effection.Scope;

export function createScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  if (!parent) {
    let [global, destroy] = buildScopeInternal();
    global.around(api, {
      create([parent]) {
        return buildScopeInternal(parent);
      },
    }, { at: "min" });
    return [global, destroy] as const;
  } else {
    return api.invoke(parent, "create", [parent]) as [
      ScopeInternal,
      () => Operation<void>,
    ];
  }
}

export function buildScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  let destructors = new Set<() => Operation<void>>();
  let destruction = createFuture<void>();

  let contexts: Record<string, unknown> = Object.create(
    parent ? (parent as ScopeInternal).contexts : null,
  );
  let scope: ScopeInternal = Object.create({
    [Symbol.toStringTag]: "Scope",
    contexts,
    get<T>(context: Context<T>): T | undefined {
      return (contexts[context.name] ?? context.defaultValue) as T | undefined;
    },
    set<T>(context: Context<T>, value: T): T {
      return api.invoke(scope, "set", [scope, context, value]) as T;
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
      return api.invoke(scope, "delete", [scope, context]);
    },
    hasOwn<T>(context: Context<T>): boolean {
      return !!Reflect.getOwnPropertyDescriptor(contexts, context.name);
    },
    run<T>(operation: () => Operation<T>): Task<T> {
      return createTask({ owner: scope, operation });
    },
    spawn<T>(operation: () => Operation<T>): Operation<Task<T>> {
      return {
        *[Symbol.iterator]() {
          return createTask({ owner: scope, operation });
        },
      };
    },

    around<A extends {}>(
      api: ApiInternal<A>,
      ...params: Parameters<ApiInternal<A>["around"]>
    ) {
      let [around, options] = params;
      if (!scope.hasOwn(api.context)) {
        scope.set(api.context, { min: [], max: [] });
      }

      let { min, max } = scope.expect(api.context);

      if (options?.at === "min") {
        min.push(around);
      } else {
        max.push(around);
      }

      api.invalidate(scope);
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

  let destroy = () => api.invoke(scope, "destroy", [scope]);
  let unbind = parent
    ? (parent as ScopeInternal).ensure(() => destroy())
    : () => {};

  scope.around(api, {
    *destroy(): Operation<void> {
      destroy = () => destruction.future;

      parent?.expect(Children).delete(scope);
      unbind();
      let outcome = Ok();
      try {
        while (destructors.size > 0) {
          let current = [...destructors];
          destructors.clear();
          for (let destructor of current) {
            try {
              yield* destructor();
            } catch (error) {
              outcome = Err(error);
            }
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

  return [scope, () => destroy()];
}

export interface ScopeInternal extends Scope, AsyncDisposable {
  contexts: Record<string, unknown>;
  ensure(op: () => Operation<void>): () => void;
  reduce<T, TSum>(
    context: Context<T>,
    fn: (sum: TSum, item: T) => TSum,
    initial: TSum,
  ): TSum;
}
