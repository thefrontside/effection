import { Children, Priority } from "./contexts.ts";
import { createFuture } from "./future.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";

import type { Context, Operation, Scope, Task } from "./types.ts";

export function createScopeInternal(
  parent?: Scope,
): [ScopeInternal, () => Operation<void>] {
  let impl = new ScopeImpl(parent as ScopeInternal);

  let scope: ScopeInternal = Object.create(Scope, {
    contexts: { value: impl.contexts },
    get: { value: impl.get.bind(impl) },
    set: { value: impl.set.bind(impl) },
    expect: { value: impl.expect.bind(impl) },
    delete: { value: impl.delete.bind(impl) },
    hasOwn: { value: impl.hasOwn.bind(impl) },
    run: { value: impl.run.bind(impl) },
    spawn: { value: impl.spawn.bind(impl) },

    ensure: { value: impl.ensure.bind(impl) },
    destroy: { value: impl.destroy.bind(impl) },
  });

  return [scope, () => impl.destroy()];
}

const Scope = Object.create(Object.prototype, {
  constructor: { value: function Scope() {} },
  [Symbol.toStringTag]: { value: "Scope" },
});

class ScopeImpl implements ScopeInternal {
  destructors = new Set<() => Operation<void>>();
  destruction = createFuture<void>();
  contexts: Record<string, unknown>;
  signaled = false;
  unbind: () => void;

  constructor(public parent?: ScopeInternal) {
    this.contexts = Object.create(
      parent ? (parent as ScopeInternal).contexts : null,
    );
    this.unbind = parent
      ? (parent as ScopeInternal).ensure(() => this.destroy())
      : () => {};
    this.set(Priority, this.expect(Priority) + 1);
    this.set(Children, new Set());
    parent?.expect(Children).add(this);
  }

  get<T>(context: Context<T>): T | undefined {
    return (this.contexts[context.name] ?? context.defaultValue) as
      | T
      | undefined;
  }
  set<T>(context: Context<T>, value: T): T {
    return this.contexts[context.name] = value;
  }
  expect<T>(context: Context<T>): T {
    let value = this.get(context);
    if (typeof value === "undefined") {
      let error = new Error(context.name);
      error.name = `MissingContextError`;
      throw error;
    }
    return value;
  }
  delete<T>(context: Context<T>): boolean {
    return delete this.contexts[context.name];
  }
  hasOwn<T>(context: Context<T>): boolean {
    return !!Reflect.getOwnPropertyDescriptor(this.contexts, context.name);
  }
  run<T>(operation: () => Operation<T>): Task<T> {
    return createTask({ owner: this, operation });
  }
  spawn<T>(operation: () => Operation<T>): Operation<Task<T>> {
    let create = () => createTask({ owner: this, operation });
    return {
      *[Symbol.iterator]() {
        return create();
      },
    };
  }

  ensure(op: () => Operation<void>): () => void {
    this.destructors.add(op);
    return () => this.destructors.delete(op);
  }

  *destroy(): Operation<void> {
    if (this.signaled) {
      return yield* this.destruction.future;
    }
    this.signaled = true;

    this.parent?.expect(Children).delete(this);
    this.unbind();
    let outcome = Ok();
    try {
      while (this.destructors.size > 0) {
        let current = [...this.destructors];
        this.destructors.clear();
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
        this.destruction.resolve();
      } else {
        this.destruction.reject(outcome.error);
      }
    }

    unbox(outcome);
  }

  [Symbol.asyncDispose]() {
    if (!this.parent) {
      return Promise.resolve();
    }
    return this.parent.run(() => this.destroy());
  }
}

export interface ScopeInternal extends Scope, AsyncDisposable {
  contexts: Record<string, unknown>;
  ensure(op: () => Operation<void>): () => void;
  destroy(): Operation<void>;
}
