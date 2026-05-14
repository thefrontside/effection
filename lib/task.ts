// deno-lint-ignore-file no-explicit-any
import { Priority } from "./contexts.ts";
import { createCoroutine, critical, SettleContext } from "./coroutine.ts";
import { type Maybe, Nothing } from "./maybe.ts";
import { Ok, type Result } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import { encapsulate, TaskGroupContext } from "./task-group.ts";
import { ErrorContext, trap } from "./trap.ts";
import type { Coroutine, Future, Operation, Task } from "./types.ts";

export interface TaskOptions<T> {
  owner: ScopeInternal;
  operation(): Operation<T>;
  prioritize?: boolean;
}

export function createTask<T>(options: TaskOptions<T>): Task<T> {
  let { owner, operation } = options;
  let [scope, destroy] = createScopeInternal(owner);
  let routine = createCoroutine({
    scope,
    *operation() {
      try {
        return yield* trap(() => encapsulate(operation));
      } finally {
        yield* critical(destroy);
      }
    },
  });

  let internal = new TaskInternal(routine, owner);

  let task = Object.create(Task, {
    halt: { value: () => internal.halt() },
    then: { value: (...args: any[]) => internal.then(...args) },
    catch: { value: (...args: any[]) => internal.catch(...args) },
    finally: { value: (...args: any[]) => internal.finally(...args) },
    [Symbol.asyncDispose]: { value: () => internal[Symbol.asyncDispose]() },
    [Symbol.iterator]: { value: () => internal[Symbol.iterator]() },
    [Symbol.toStringTag]: { value: internal[Symbol.toStringTag] },
  });

  let group = scope.expect(TaskGroupContext);
  group.tasks.add(task);

  let unbind = owner.ensure(task.halt);

  scope.ensure(function* () {
    unbind();
    group.tasks.delete(task);
  });

  if (options.prioritize) {
    scope.set(Priority, owner.get(Priority));
  }

  routine.resume(Ok());

  return task;
}

const Task = Object.create(Promise.prototype, {
  constructor: { value: function Task() {} },
  [Symbol.toStringTag]: { value: "Task" },
});

class TaskInternal<T> implements Task<T> {
  _promise?: Promise<T>;
  scope: ScopeInternal;
  control: TaskControl;
  constructor(public routine: Coroutine<T>, owner: ScopeInternal) {
    this.control = new TaskControl(routine, owner);
    this.scope = this.routine.scope as ScopeInternal;
    this.scope.set(SettleContext, this.control.settle.bind(this.control));
  }

  then(...args: any[]): Promise<any> {
    return this.promise.then(...args);
  }
  catch(...args: any[]): Promise<any> {
    return this.promise.catch(...args);
  }
  finally(...args: any[]): Promise<any> {
    return this.promise.finally(...args);
  }

  halt(): Future<void> {
    let { future } = this.routine;
    let { control } = this;

    let signal = () => {
      this.control.interrupt();
      return future;
    };
    let halted = async () => {
      let outcome = await signal();
      if (control.interrupted && outcome.exists && !outcome.value.ok) {
        throw outcome.value.error;
      }
    };

    return Object.create(future, {
      [Symbol.iterator]: {
        value: function* halt() {
          let outcome = yield* signal();
          if (control.interrupted && outcome.exists && !outcome.value.ok) {
            throw outcome.value.error;
          }
        },
      },
      then: { value: (...args: any[]) => halted().then(...args) },
      catch: { value: (...args: any[]) => halted().catch(...args) },
      finally: { value: (...args: any[]) => halted().finally(...args) },
    });
  }
  [Symbol.asyncDispose](): Promise<void> {
    return this.halt();
  }

  *[Symbol.iterator]() {
    let outcome = yield* this.routine.future;
    if (outcome.exists) {
      let result = outcome.value;
      if (result.ok) {
        return result.value;
      } else {
        throw result.error;
      }
    } else {
      throw new Error(`halted`);
    }
  }

  [Symbol.toStringTag] = "Task";

  get promise() {
    if (this._promise) {
      return this._promise;
    }
    return this._promise = new Promise((resolve, reject) => {
      this.routine.future.then((outcome) => {
        if (outcome.exists) {
          let result = outcome.value;
          if (result.ok) {
            resolve(result.value);
          } else {
            reject(result.error);
          }
        } else {
          reject(new Error("halted"));
        }
      });
    });
  }
}

class TaskControl {
  interrupted = false;
  settled = false;
  constructor(
    public routine: Coroutine<unknown>,
    private owner: ScopeInternal,
  ) {}

  interrupt() {
    if (this.settled || this.interrupted) return;
    this.interrupted = true;
    this.routine.unwind();
  }

  settle(
    outcome: Maybe<Result<unknown>>,
    next: (outcome: Maybe<Result<unknown>>) => void,
  ): void {
    this.settled = true;

    let final: Maybe<Result<unknown>>;
    if (outcome.exists && !outcome.value.ok) {
      final = outcome;
    } else if (outcome.exists && this.interrupted) {
      final = Nothing();
    } else {
      final = outcome;
    }

    next(final);

    if (final.exists && !final.value.ok && !this.interrupted) {
      // raise if there was an error, and we were not halted.
      this.owner.expect(ErrorContext)
        .raise(final.value.error);
    }
  }
}
