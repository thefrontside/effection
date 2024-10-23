import { createContext } from "./context.ts";
import { Routine } from "./contexts.ts";
import { createCoroutine } from "./coroutine.ts";
import { drain } from "./drain.ts";
import { lazyPromise, lazyPromiseWithResolvers } from "./lazy-promise.ts";
import { Just, Maybe, Nothing } from "./maybe.ts";
import { Err, Ok, Result, unbox } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope.ts";
import type {
  Coroutine,
  Future,
  Operation,
  Resolve,
  Scope,
  Task,
} from "./types.ts";

export interface TaskOptions<T> {
  owner: ScopeInternal;
  operation(): Operation<T>;
}

export interface NewTask<T> {
  scope: Scope;
  routine: Coroutine<Maybe<T>>;
  task: Task<T>;
  start(): void;
}

export function createTask<T>(options: TaskOptions<T>): NewTask<T> {
  let { owner, operation } = options;
  let [scope, destroy] = createScopeInternal(owner);

  TaskGroup.ensureOwn(scope);

  let routine = createCoroutine({
    scope,
    operation: () => trapset(() => after(operation, destroy)),
  });

  let { promise, resolve, reject } = lazyPromiseWithResolvers<T>();

  let initiateHalt = (resolve: Resolve<Result<void>>) => {
    if (scope.hasOwn(TrapContext)) {
      let trap = scope.expect(TrapContext);
      let current = routine.data.discard;
      routine.data.discard = (exit) =>
        current((result) => {
          if (!result.ok) {
            trap.result = result;
          }
          exit(result);
        });
      return routine.return(
        trap.result = Ok(Nothing()),
        drain((result) => resolve(result.ok ? Ok() : result)),
      );
    } else {
      return routine.return(
        Ok(Nothing()),
        drain((result) => resolve(result.ok ? Ok() : result)),
      );
    }
  };

  let halt = lazyPromise<void>((resolve, reject) => {
    initiateHalt((result) => result.ok ? resolve() : reject(result.error));
  });

  Object.defineProperty(halt, Symbol.iterator, {
    enumerable: false,
    *value(): Operation<void> {
      yield ({
        description: "halt",
        enter: (resolve) => {
          let unsubscribe = initiateHalt(resolve);

          return (done) => {
            unsubscribe();
            done(Ok());
          };
        },
      });
    },
  });

  let task = Object.defineProperty(promise, "halt", {
    enumerable: false,
    value: () => halt as Future<void>,
  }) as Task<T>;

  let group = TaskGroup.ensureOwn(owner);

  let link = group.link(owner, task);

  scope.set(Routine, routine);

  let start = () =>
    routine.next(
      Ok(),
      drain((result) => {
        link.close(result);
        if (result.ok) {
          if (result.value.exists) {
            resolve(result.value.value);
          } else {
            reject(new Error("halted"));
          }
        } else {
          reject(result.error);
        }
      }),
    );

  return { task, scope, routine, start };
}

export const TaskGroupContext = createContext<TaskGroup>("@effection/tasks");

export function encapsulate<T>(operation: () => Operation<T>): Operation<T> {
  return TaskGroupContext.with(new TaskGroup(), function* (group) {
    try {
      return yield* operation();
    } finally {
      yield* group.halt();
    }
  });
}

class TaskGroup {
  static ensureOwn(scope: ScopeInternal): TaskGroup {
    if (!scope.hasOwn(TaskGroupContext)) {
      let group = scope.set(TaskGroupContext, new TaskGroup());
      scope.ensure(() => group.halt());
    }
    return scope.expect(TaskGroupContext);
  }

  links = new Set<TaskLink<unknown>>();

  link<T>(owner: Scope, task: Task<T>) {
    return new TaskLink(owner, task, this.links);
  }

  *halt() {
    let links = [...this.links].reverse();
    links.forEach((link) => link.sever());
    let outcome = Ok();
    for (let link of links) {
      let result = yield* box(link.task.halt);
      if (!result.ok) {
        outcome = result;
      }
    }
    return unbox(outcome);
  }
}

class TaskLink<T> {
  constructor(
    public owner: Scope,
    public task: Task<T>,
    public links: Set<TaskLink<unknown>>,
  ) {
    this.links.add(this);
  }

  close(result: Result<Maybe<T>>) {
    this.links.delete(this);
    if (!result.ok) {
      let trap = this.owner.get(TrapContext);
      if (trap) {
        trap.result = result;
        this.owner.get(Routine)?.return(trap.result);
      }
    }
  }

  sever() {
    this.links.delete(this);
    this.close = () => {};
  }
}

function* box<T>(op: () => Operation<T>): Operation<Result<T>> {
  try {
    return Ok(yield* op());
  } catch (error) {
    return Err(error);
  }
}

const TrapContext = createContext<{ result: Result<Maybe<unknown>> }>(
  "@effection/trap",
);

function trapset<T>(op: () => Operation<T>): Operation<Maybe<T>> {
  let result = Ok(Nothing<T>());
  return TrapContext.with({ result }, function* (trap) {
    try {
      let value = yield* op();
      if (trap.result === result) {
        trap.result = Ok(Just(value));
      }
    } catch (error) {
      trap.result = Err(error);
    } finally {
      // deno-lint-ignore no-unsafe-finally
      return unbox(trap.result) as Maybe<T>;
    }
  });
}

export function* trap<T>(op: () => Operation<T>): Operation<T> {
  let outcome = yield* trapset(op);
  if (outcome.exists) {
    return outcome.value;
  } else {
    return (yield {
      description: "propagate halt",
      enter: (resolve, routine) => {
        let trap = routine.scope.expect(TrapContext);
        trap.result = Ok(Nothing());
        routine.return(trap.result);
        resolve(Ok());
        return (resolve) => {
          resolve(Ok());
        };
      },
    }) as T;
  }
}

function* after<T>(
  op: () => Operation<T>,
  epilogue: () => Operation<void>,
): Operation<T> {
  try {
    return yield* op();
  } finally {
    yield* epilogue();
  }
}
