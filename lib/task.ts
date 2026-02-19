// deno-lint-ignore-file no-unsafe-finally
import { DelimiterContext, ErrorContext } from "./delimiter.ts";
import { createCoroutine } from "./coroutine.ts";
import { Delimiter } from "./delimiter.ts";
import { createFuture } from "./future.ts";
import { Ok } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import type { Coroutine, Operation, Scope, Task } from "./types.ts";
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
  let future = createFuture<T>();

  let task = Object.defineProperties(future.future, {
    halt: {
      enumerable: false,
      value() {
        return Object.defineProperties(Object.create(Promise.prototype), {
          [Symbol.iterator]: {
            enumerable: false,
            value: destroy,
          },
          then: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["then"]>) {
              return owner.run(destroy).then(...args);
            },
          },
          catch: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["catch"]>) {
              return owner.run(destroy).catch(...args);
            },
          },
          finally: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["finally"]>) {
              return owner.run(destroy).finally(...args);
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

  let top = new Delimiter<T>(() => encapsulate(operation));
  scope.set(DelimiterContext, top as Delimiter<unknown>);

  let group = scope.expect(TaskGroupContext);
  group.add(task);

  let boundary = owner.expect(ErrorContext);
  scope.set(ErrorContext, top);

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

  let routine = createCoroutine({
    scope,
    *operation() {
      try {
        yield* top;
      } finally {
        yield* destroy();
      }
    },
  });

  let start = () => routine.next(Ok());

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
