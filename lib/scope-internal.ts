import { Children, Priority } from "./contexts.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";
import type { Context, Operation, Scope, Task } from "./types.ts";
import { type WithResolvers, withResolvers } from "./with-resolvers.ts";

export function createScopeInternal(
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
      return contexts[context.name] = value;
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
      return delete contexts[context.name];
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

export interface ScopeInternal extends Scope, AsyncDisposable {
  contexts: Record<string, unknown>;
  ensure(op: () => Operation<void>): () => void;
}
