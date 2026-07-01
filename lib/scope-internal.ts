import { Children, Priority } from "./contexts.ts";
import { createFuture } from "./future.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";

import type { Context, Operation, Scope, Task } from "./types.ts";

// Shared prototype so all scope instances have the same hidden class,
// avoiding deoptimization when V8 encounters differently-shaped scope objects.
const scopePrototype = {
  [Symbol.toStringTag]: "Scope",
  get<T>(this: ScopeInternal, context: Context<T>): T | undefined {
    return (this.contexts[context.name] ?? context.defaultValue) as
      | T
      | undefined;
  },
  set<T>(this: ScopeInternal, context: Context<T>, value: T): T {
    return this.contexts[context.name] = value;
  },
  expect<T>(this: ScopeInternal, context: Context<T>): T {
    let value = this.get(context);
    if (typeof value === "undefined") {
      let error = new Error(context.name);
      error.name = `MissingContextError`;
      throw error;
    }
    return value;
  },
  delete<T>(this: ScopeInternal, context: Context<T>): boolean {
    return delete this.contexts[context.name];
  },
  hasOwn<T>(this: ScopeInternal, context: Context<T>): boolean {
    return !!Reflect.getOwnPropertyDescriptor(this.contexts, context.name);
  },
  run<T>(this: ScopeInternal, operation: () => Operation<T>): Task<T> {
    return createTask({ owner: this, operation });
  },
  spawn<T>(
    this: ScopeInternal,
    operation: () => Operation<T>,
  ): Operation<Task<T>> {
    // deno-lint-ignore no-this-alias
    let owner = this;
    return {
      *[Symbol.iterator]() {
        return createTask({ owner, operation });
      },
    };
  },
  ensure(this: ScopeInternal, op: () => Operation<void>): () => void {
    this.destructors.add(op);
    return () => this.destructors.delete(op);
  },
};

export function createScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  let destructors = new Set<() => Operation<void>>();
  let destruction = createFuture<void>();

  let contexts: Record<string, unknown> = Object.create(
    parent ? (parent as ScopeInternal).contexts : null,
  );
  let scope: ScopeInternal = Object.create(scopePrototype);
  scope.contexts = contexts;
  scope.destructors = destructors;

  scope.set(Priority, scope.expect(Priority) + 1);
  scope.set(Children, new Set());
  parent?.expect(Children).add(scope);

  let destroy = function* (): Operation<void> {
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
            outcome = Err(error as Error);
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
  };

  let unbind = parent
    ? (parent as ScopeInternal).ensure(() => destroy())
    : () => {};

  return [scope, () => destroy()];
}

export interface ScopeInternal extends Scope, AsyncDisposable {
  contexts: Record<string, unknown>;
  destructors: Set<() => Operation<void>>;
  ensure(op: () => Operation<void>): () => void;
}
