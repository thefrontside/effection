import { Children, Generation } from "./contexts.ts";
import { Context, Effect, Future, Operation, Scope, Task } from "./types.ts";
import { Err, Ok, unbox } from "./result.ts";
import { createTask } from "./task.ts";

export const [global] = createScopeInternal();

export function createScope(
  parent: Scope = global,
): [Scope, () => Future<void>] {
  let [scope, destroy] = createScopeInternal(parent);
  return [scope, () => parent.run(destroy)];
}

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

  scope.set(Generation, scope.expect(Generation) + 1);
  scope.set(Children, new Set());
  parent?.expect(Children).add(scope);

  let unbind = parent ? (parent as ScopeInternal).ensure(destroy) : () => {};

  function* destroy(): Operation<void> {
    parent?.expect(Children).delete(scope);
    unbind();
    let outcome = Ok();
    for (let destructor of [...destructors].reverse()) {
      try {
        destructors.delete(destructor);
        yield* destructor();
      } catch (error) {
        outcome = Err(error);
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

export function* useScope(): Operation<Scope> {
  return (yield {
    description: `useScope()`,
    enter(resolve, { scope }) {
      resolve(Ok(scope));
      return (resolve) => resolve(Ok());
    },
  } as Effect<Scope>) as Scope;
}
