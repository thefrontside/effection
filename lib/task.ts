// deno-lint-ignore-file no-unsafe-finally
import { DelimiterContext, ErrorContext } from "./delimiter.ts";
import { createCoroutine } from "./coroutine.ts";
import { Delimiter } from "./delimiter.ts";
import { createFuture } from "./future.ts";
import { Ok } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import type { Coroutine, Effect, Operation, Scope, Task } from "./types.ts";
import { encapsulate, TaskGroupContext } from "./task-group.ts";
import { useScope } from "./scope.ts";

export interface TaskOptions<T> {
  owner: ScopeInternal;
  operation(): Operation<T>;
}

export interface NewTask<T> {
  scope: Scope;
  routine: Coroutine;
  task: Task<T>;
  start(): void;
}

export function createTask<T>(options: TaskOptions<T>): NewTask<T> {
  let { owner, operation } = options;
  let [scope, destroy] = createScopeInternal(owner);
  let { destroyed } = scope;
  let future = createFuture<T>();

  let top = new Delimiter<T>(() => encapsulate(operation));

  let task = Object.defineProperties(future.future, {
    halt: {
      enumerable: false,
      value() {
        let signal = () => top.interrupt();
        return Object.defineProperties(Object.create(Promise.prototype), {
          [Symbol.iterator]: {
            enumerable: false,
            value: function* () {
              signal();
              yield* destroyed;
            },
          },
          then: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["then"]>) {
              signal();
              return destroyed.then(...args);
            },
          },
          catch: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["catch"]>) {
              signal();
              return destroyed.catch(...args);
            },
          },
          finally: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["finally"]>) {
              signal();
              return destroyed.finally(...args);
            },
          },
        });
      },
    },
    [Symbol.iterator]: {
      enumerable: false,
      value: future.future[Symbol.iterator],
    },
    [Symbol.toStringTag]: {
      enumerable: false,
      value: "Task",
    },
    [Symbol.asyncDispose]: {
      enumerable: false,
      value: () => task.halt(),
    },
  }) as Task<T>;

  let routine = createCoroutine({
    scope,
    *operation() {
      try {
        scope.set(DelimiterContext, top as Delimiter<unknown>);
        scope.set(ErrorContext, top);
        let group = scope.expect(TaskGroupContext);
        group.add(task);
        let boundary = owner.expect(ErrorContext);
        scope.ensure(function* () {
          try {
            yield* top.close();
          } finally {
            group.delete(task);
            let { outcome } = top;
            if (outcome!.exists) {
              let result = outcome!.value;
              if (result.ok) {
                future.resolve(result.value);
              } else {
                let { error } = result;
                future.reject(error);
                boundary.raise(error);
              }
            } else {
              future.reject(new Error("halted"));
            }
          }
        });

        yield started;

        yield* top;
      } finally {
        yield* destroy();
      }
    },
  });

  top.routine = routine;

  let start = () => {
    let { done, value } = routine.data.iterator.next();
    if (done || value !== started) {
      throw new Error("Corrupted task: body did not yield the ready sentinel");
    }
    routine.next(Ok());
  };

  return { scope, routine, task, start };
}

export function* trap<T>(operation: () => Operation<T>): Operation<T> {
  let scope = yield* useScope();

  let original = {
    error: scope.expect(ErrorContext),
    delimiter: scope.expect(DelimiterContext),
  };

  let delimiter = new Delimiter(operation, original.delimiter);

  scope.set(ErrorContext, delimiter);
  scope.set(DelimiterContext, delimiter as Delimiter<unknown>);
  try {
    yield* delimiter;
  } finally {
    scope.set(ErrorContext, original.error);
    scope.set(DelimiterContext, original.delimiter);
    let outcome = delimiter.outcome!;
    return (yield {
      description: "trap return",
      enter(resolve) {
        if (outcome.exists) {
          resolve(outcome.value);
        } else {
          original.delimiter.interrupt();
        }
        return (didExit) => didExit(Ok());
      },
    }) as T;
  }
}

const started = {
  description:
    "A sentinel effect that is never evaluated. It just ensures that the routine is entered so that teardown can be treated normally",
  enter() {
    return () => {};
  },
} satisfies Effect<never>;
