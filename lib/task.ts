// deno-lint-ignore-file no-unsafe-finally
import { DelimiterContext, ErrorContext } from "./delimiter.ts";
import { createCoroutine } from "./coroutine.ts";
import { Delimiter } from "./delimiter.ts";
import { createFuture } from "./future.ts";
import { currentRoutine } from "./reducer.ts";
import { Ok } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import type { Coroutine, Operation, Scope, Task } from "./types.ts";
import { encapsulate, TaskGroupContext } from "./task-group.ts";
import { useScope } from "./scope.ts";

/**
 * Thrown when `task.halt()` is invoked from inside the task's own
 * routine. Halting yourself is a self-join: the calling code can't
 * finish unwinding because it is the work being unwound.
 *
 * Use a separate operation (e.g. spawn a sibling task to halt this
 * one) or rethrow this error to abort the current task instead.
 *
 * @since 4.1
 */
export class SelfHaltError extends Error {
  override name = "SelfHaltError";
  constructor() {
    super(
      "task.halt() was called from inside the task's own routine; " +
        "use a separate operation to halt this task or rethrow to abort it",
    );
  }
}

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

  let top = new Delimiter<T>(() => encapsulate(operation));
  scope.set(DelimiterContext, top as Delimiter<unknown>);

  // Captured after createCoroutine below. Both task.halt() surfaces
  // compare the reducer's currently-executing routine to this one to
  // detect self-halt synchronously and throw SelfHaltError instead of
  // self-joining.
  let mainRoutine: Coroutine | undefined;

  // The Promise surface of task.halt() must NOT spawn a parallel
  // coroutine in the owner scope (which is what the previous
  // owner.run(destroy) implementation did, and which was the source of
  // #1159). Instead, synchronously interrupt the task's own delimiter
  // and resolve when the task's future settles.
  //
  // halt() rejects when the cleanup chain itself produced an error
  // (e.g., a finally block threw). It resolves when the task halted
  // cleanly, when it had already shut down before halt was called, or
  // when it errored naturally without halt being involved. The
  // discriminator is `top.level > 0`: level is bumped only when exit
  // actually fires routine.return, so an outcome of Just(Err) with
  // level > 0 means an interrupt was issued and the cleanup that ran
  // produced the error — that is the case v4's owner.run(destroy)
  // chain would have thrown on.
  let task = Object.defineProperties(future.future, {
    halt: {
      enumerable: false,
      value() {
        if (mainRoutine && currentRoutine === mainRoutine) {
          throw new SelfHaltError();
        }
        if (!top.finalized) {
          top.interrupt();
        }
        let waitForTeardown = (): Promise<void> =>
          new Promise<void>((resolve, reject) => {
            let settle = () => {
              if (
                top.outcome?.exists &&
                !top.outcome.value.ok &&
                top.level > 0
              ) {
                reject(top.outcome.value.error);
              } else {
                resolve();
              }
            };
            future.future.then(settle, settle);
          });
        return Object.defineProperties(Object.create(Promise.prototype), {
          [Symbol.iterator]: {
            enumerable: false,
            value: destroy,
          },
          then: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["then"]>) {
              return waitForTeardown().then(...args);
            },
          },
          catch: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["catch"]>) {
              return waitForTeardown().catch(...args);
            },
          },
          finally: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["finally"]>) {
              return waitForTeardown().finally(...args);
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
  mainRoutine = routine;

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
