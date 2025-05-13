import { createCoroutine } from "./coroutine.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import type { Coroutine, Operation, Scope, Task } from "./types.ts";
import { box } from "./box.ts";
import { Err, Ok, type Result } from "./result.ts";
import { createFuture } from "./future.ts";
import assert from "node:assert";

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

export type TaskState<T> = {
  status: "pending";
  halted: boolean;
} | {
  status: "finalizing";
  halted: boolean;
  computation: Result<T>;
  finalization: Result<void>;
} | {
  status: "finalized";
  halted: boolean;
  computation: Result<T>;
  finalization: Result<void>;
};

export function createTask<T>(options: TaskOptions<T>): NewTask<T> {
  let { owner, operation } = options;
  let [scope, destroy] = createScopeInternal(owner);

  let state: { current: TaskState<T> } = {
    current: { status: "pending", halted: false },
  };

  let future = createFuture<T>();

  let halted = createFuture<void>();

  let routine = createCoroutine<void>({
    scope,
    *operation() {
      let outcome: Result<T> | undefined = undefined;
      try {
        outcome = yield* box(operation);
        try {
          state.current = {
            status: "finalizing",
            halted: state.current.halted,
            computation: outcome,
            finalization: state.current.halted
              ? outcome.ok ? Ok() : outcome
              : Ok(),
          };
          yield* destroy();
          state.current = {
            status: "finalized",
            halted: state.current.halted,
            computation: outcome,
            finalization: state.current.finalization,
          };
        } catch (error) {
          state.current = {
            status: "finalized",
            halted: state.current.halted,
            computation: outcome,
            finalization: Err(error as Error),
          };
        }
      } finally {
        if (state.current.status === "pending") {
          state.current = {
            status: "finalized",
            halted: true,
            computation: Err(new Error("halted")),
            finalization: Ok(),
          };
        }
        let { current } = state;
        assert(current.status === "finalized");
        if (!current.halted) {
          halted.resolve();
          if (current.computation.ok) {
            future.resolve(current.computation.value);
          } else {
            future.reject(current.computation.error);
          }
        } else {
          future.reject(new Error("halted"));
          let { finalization } = current;
          if (!finalization.ok) {
            halted.reject(finalization.error);
          } else {
            halted.resolve();
          }
        }
      }
    },
  });

  let halt = () => {
    halt = () => {};
    state.current.halted = true;
    routine.return(Ok());
  };

  let task = Object.defineProperties(future.future, {
    halt: {
      enumerable: false,
      value() {
        return Object.defineProperties(Object.create(Promise.prototype), {
          [Symbol.iterator]: {
            enumerable: false,
            *value() {
              halt();
              yield* halted.future;
            },
          },
          then: {
            enumerable: false,
            value(...args: Parameters<typeof halted.future["then"]>) {
              halt();
              return halted.future.then(...args);
            },
          },
          catch: {
            enumerable: false,
            value(...args: Parameters<typeof halted.future["catch"]>) {
              halt();
              return halted.future.catch(...args);
            },
          },
          finally: {
            enumerable: false,
            value(...args: Parameters<typeof halted.future["finally"]>) {
              halt();
              return halted.future.finally(...args);
            },
          },
        });
      },
    },
    [Symbol.iterator]: {
      enumerable: false,
      value: future.future[Symbol.iterator],
    },
  }) as Task<T>;

  let start = () => routine.next(Ok());

  return { task, scope, routine, start };
}

export function trap<T>(op: () => Operation<T>): Operation<T> {
  return op();
}

export function encapsulate<T>(op: () => Operation<T>): Operation<T> {
  return op();
}

// export function createTask<T>(options: TaskOptions<T>): NewTask<T> {
//   let { owner, operation } = options;
//   let [scope, destroy] = createScopeInternal(owner);

//   TaskGroup.ensureOwn(scope);

//   let routine = createCoroutine({
//     scope,
//     operation: () => trapset(() => after(operation, destroy)),
//   });

//   let promise = lazyPromiseWithResolvers<T>();
//   let future = withResolvers<T>();

//   let resolve = (value: T) => {
//     promise.resolve(value);
//     future.resolve(value);
//   };

//   let reject = (error: Error) => {
//     promise.reject(error);
//     future.reject(error);
//   };

//   let initiateHalt = (resolve: Resolve<Result<void>>) => {
//     if (scope.hasOwn(TrapContext)) {
//       let trap = scope.expect(TrapContext);
//       let current = routine.data.discard;
//       routine.data.discard = (exit) =>
//         current((result) => {
//           if (!result.ok) {
//             trap.result = result;
//           }
//           exit(result);
//         });
//       return routine.return(
//         trap.result = Ok(Nothing()),
//         drain((result) => resolve(result.ok ? Ok() : result)),
//       );
//     } else {
//       return routine.return(
//         Ok(Nothing()),
//         drain((result) => resolve(result.ok ? Ok() : result)),
//       );
//     }
//   };

//   let halt = lazyPromise<void>((resolve, reject) => {
//     initiateHalt((result) => result.ok ? resolve() : reject(result.error));
//   });

//   Object.defineProperty(halt, Symbol.iterator, {
//     enumerable: false,
//     *value(): Operation<void> {
//       yield ({
//         description: "halt",
//         enter: (resolve) => {
//           let unsubscribe = initiateHalt(resolve);

//           return (done) => {
//             unsubscribe();
//             done(Ok());
//           };
//         },
//       });
//     },
//   });

//   let task = Object.defineProperties(promise.promise, {
//     [Symbol.toStringTag]: {
//       enumerable: false,
//       value: "Task",
//     },
//     [Symbol.iterator]: {
//       enumerable: false,
//       value: future.operation[Symbol.iterator],
//     },
//     halt: {
//       enumerable: false,
//       value: () => halt,
//     },
//   }) as Task<T>;

//   let group = TaskGroup.ensureOwn(owner);

//   let link = group.link(owner, task);

//   scope.set(Routine, routine);

//   let start = () =>
//     routine.next(
//       Ok(),
//       drain((result) => {
//         link.close(result);
//         if (result.ok) {
//           if (result.value.exists) {
//             resolve(result.value.value);
//           } else {
//             reject(new Error("halted"));
//           }
//         } else {
//           reject(result.error);
//         }
//       }),
//     );

//   return { task, scope, routine, start };
// }

// export const TaskGroupContext = createContext<TaskGroup>("@effection/tasks");

// export function encapsulate<T>(operation: () => Operation<T>): Operation<T> {
//   return TaskGroupContext.with(new TaskGroup(), function* (group) {
//     try {
//       return yield* operation();
//     } finally {
//       yield* group.halt();
//     }
//   });
// }

// class TaskGroup {
//   static ensureOwn(scope: ScopeInternal): TaskGroup {
//     if (!scope.hasOwn(TaskGroupContext)) {
//       let group = scope.set(TaskGroupContext, new TaskGroup());
//       scope.ensure(() => group.halt());
//     }
//     return scope.expect(TaskGroupContext);
//   }

//   links = new Set<TaskLink<unknown>>();

//   link<T>(owner: Scope, task: Task<T>) {
//     return new TaskLink(owner, task, this.links);
//   }

//   *halt() {
//     let links = [...this.links].reverse();
//     links.forEach((link) => link.sever());
//     let outcome = Ok();
//     for (let link of links) {
//       let result = yield* box(link.task.halt);
//       if (!result.ok) {
//         outcome = result;
//       }
//     }
//     return unbox(outcome);
//   }
// }

// class TaskLink<T> {
//   constructor(
//     public owner: Scope,
//     public task: Task<T>,
//     public links: Set<TaskLink<unknown>>,
//   ) {
//     this.links.add(this);
//   }

//   close(result: Result<Maybe<T>>) {
//     this.links.delete(this);
//     if (!result.ok) {
//       let trap = this.owner.get(TrapContext);
//       if (trap) {
//         trap.result = result;
//         this.owner.get(Routine)?.return(trap.result);
//       }
//     }
//   }

//   sever() {
//     this.links.delete(this);
//     this.close = () => {};
//   }
// }

// const TrapContext = createContext<{ result: Result<Maybe<unknown>> }>(
//   "@effection/trap",
// );

// function trapset<T>(op: () => Operation<T>): Operation<Maybe<T>> {
//   let result = Ok(Nothing<T>());
//   return TrapContext.with({ result }, function* (trap) {
//     try {
//       let value = yield* op();
//       if (trap.result === result) {
//         trap.result = Ok(Just(value));
//       }
//     } catch (error) {
//       trap.result = Err(error as Error);
//     } finally {
//       // deno-lint-ignore no-unsafe-finally
//       return unbox(trap.result) as Maybe<T>;
//     }
//   });
// }

// export function* trap<T>(op: () => Operation<T>): Operation<T> {
//   let outcome = yield* trapset(op);
//   if (outcome.exists) {
//     return outcome.value;
//   } else {
//     return (yield {
//       description: "propagate halt",
//       enter: (resolve, routine) => {
//         let trap = routine.scope.expect(TrapContext);
//         trap.result = Ok(Nothing());
//         routine.return(trap.result);
//         resolve(Ok());
//         return (resolve) => {
//           resolve(Ok());
//         };
//       },
//     }) as T;
//   }
// }

// function* after<T>(
//   op: () => Operation<T>,
//   epilogue: () => Operation<void>,
// ): Operation<T> {
//   try {
//     return yield* op();
//   } finally {
//     yield* epilogue();
//   }
// }
