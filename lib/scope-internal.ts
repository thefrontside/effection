import type { ApiInternal } from "./api-internal.ts";
import { api as effection } from "./api.ts";
import { Children, Priority } from "./contexts.ts";
import { Reducer } from "./reducer.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";
import type { Context, Operation, Scope, Task } from "./types.ts";
import { type WithResolvers, withResolvers } from "./with-resolvers.ts";

const api = effection.Scope;
const reducerApi = effection.Reducer;

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
    let defaultReducer = new Reducer();
    global.around(reducerApi, {
      reduce([instruction]) {
        defaultReducer.reduce(instruction);
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

  let unbind = parent ? (parent as ScopeInternal).ensure(destroy) : () => {};

  let destruction: WithResolvers<void> | undefined = undefined;

  scope.around(api, {
    *destroy(): Operation<void> {
      if (destruction) {
        return yield* destruction.operation;
      }
      destruction = withResolvers<void>("await destruction");
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

export interface ScopeInternal extends Scope, AsyncDisposable {
  contexts: Record<string, unknown>;
  ensure(op: () => Operation<void>): () => void;
  reduce<T, TSum>(
    context: Context<T>,
    fn: (sum: TSum, item: T) => TSum,
    initial: TSum,
  ): TSum;
}
