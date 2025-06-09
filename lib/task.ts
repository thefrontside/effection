import { box } from "./box.ts";
import { createContext } from "./context.ts";
import { createCoroutine } from "./coroutine.ts";
import { createFuture } from "./future.ts";
import { Just, type Maybe, Nothing } from "./maybe.ts";
import { Err, Ok, type Result } from "./result.ts";
import { createScopeInternal, type ScopeInternal } from "./scope-internal.ts";
import type { Coroutine, Operation, Scope, Task } from "./types.ts";

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
  let finalized = createFuture<
    { outcome: Maybe<Result<T>>; teardown: Result<void> }
  >();

  let trap = owner.expect(TrapContext);

  scope.set(TrapContext, { outcome: Nothing<Result<T>>() });

  scope.ensure(function* teardown(): Operation<void> {
    routine.scope.expect(TrapContext).outcome = Nothing();
    routine.return(Ok());
  });

  scope.set(CrashContext, (trap, error) => {
    trap.outcome = Just(Err(error));
    routine.return(Ok());
  });

  function* halt(): Operation<void> {
    yield* destroy();
    let { outcome, teardown } = yield* finalized.future;
    if (!teardown.ok) {
      throw teardown.error;
    }
    if (outcome.exists && !outcome.value.ok) {
      throw outcome.value.error;
    }
  }

  let task = Object.defineProperties(future.future, {
    halt: {
      enumerable: false,
      value() {
        return Object.defineProperties(Object.create(Promise.prototype), {
          [Symbol.iterator]: {
            enumerable: false,
            value: halt,
          },
          then: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["then"]>) {
              return owner.run(halt).then(...args);
            },
          },
          catch: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["catch"]>) {
              return owner.run(halt).catch(...args);
            },
          },
          finally: {
            enumerable: false,
            value(...args: Parameters<Promise<void>["finally"]>) {
              return owner.run(halt).finally(...args);
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
  }) as Task<T>;

  let routine = createCoroutine<void>({
    scope,
    *operation() {
      routine.runLevel = 1;

      let outcome = yield* trapsafe(operation);

      scope.set(CrashContext, () => {});
      let crash = owner.expect(CrashContext);

      routine.runLevel = 2;

      let teardown = yield* box(destroy);
      finalized.resolve({ outcome, teardown });

      if (!teardown.ok) {
        future.reject(teardown.error);
        crash(trap, teardown.error);
      } else {
        if (outcome.exists) {
          let result = outcome.value;
          if (result.ok) {
            future.resolve(result.value);
          } else {
            future.reject(result.error);
	    crash(trap, result.error);
          }
        } else {
          future.reject(new Error("halted"));
        }
      }
    },
  });

  let start = () => routine.next(Ok());

  return { task, scope, routine, start };
}

const CrashContext = createContext<(trap: Trap<unknown>, error: Error) => void>(
  "@effection/crash",
  () => {},
);

// type TaskState<T> = {
//   status: "pending";
//   halted: boolean;
// } | {
//   status: "finalizing";
//   halted: boolean;
//   computation: Result<T>;
//   finalization: Result<void>;
// } | {
//   status: "finalized";
//   halted: boolean;
//   computation: Result<T>;
//   finalization: Result<void>;
// };

interface Trap<T> {
  outcome: Maybe<Result<T>>;
}

const TrapContext = createContext<Trap<unknown>>("@effection/trap", {
  outcome: Just(Err(new Error("bare trap"))),
});

function* trapsafe<T>(
  op: () => Operation<T>,
): Operation<Maybe<Result<T>>> {
  let trap = yield* TrapContext.expect();
  let original = trap.outcome;
  try {
    let value = yield* op();
    if (trap.outcome === original) {
      trap.outcome = Just(Ok(value));
    }
  } catch (error) {
    trap.outcome = Just(Err(error as Error));
  } finally {
    // deno-lint-ignore no-unsafe-finally
    return (yield {
      description: "trapset return",
      enter(resolve) {
        resolve(Ok(trap.outcome));
        return (didExit) => didExit(Ok());
      },
    }) as Maybe<Result<T>>;
  }
}

// export function* trap<T>(op: () => Operation<T>): Operation<T> {
//   let original = yield* TrapContext.expect();
//   let trap: Trap<T> = { outcome: Nothing<Result<T>>() };
//   try {
//     yield* TrapContext.set(trap);
//     let value = yield* op();
//     trap.outcome = Just(Ok(value));
//   } catch (error) {
//     trap.outcome = Just(Err(error as Error));
//   } finally {
//     yield* TrapContext.set(original);
//     const { outcome } = trap;
//     if (outcome.exists) {
//       const { value: result } = outcome;
//       if (result.ok) {
//         return result.value;
//       } else {
//         throw result.error;
//       }
//     } else {
//       return (yield {
//         description: "propagate halt",
//         enter(_, routine) {
// 	  original.outcome = Nothing();
//           routine.return(Ok());
//           return (didExit) => didExit(Ok());
//         },
//       }) as T;
//     }
//   }
// }

// export function createTask<T>(options: TaskOptions<T>): NewTask<T> {
//   let { owner, operation } = options;
//   let [scope] = createScopeInternal(owner);

//   let link = owner.expect(TaskLinkContext);
//   let children = new TaskTree((error) => {
//     let trap = routine.scope.expect(TrapContext);
//     trap.outcome = Just(Err(error));
//     routine.return(Ok());
//   });
//   scope.set(TaskLinkContext, children);
//   scope.ensure(() => task.halt());

//   let state: { current: TaskState<T> } = {
//     current: { status: "pending", halted: false },
//   };

//   let future = createFuture<T>();

//   let halted = createFuture<void>();

//   let halt = () => {
//     halt = () => {};
//     routine.runLevel = 1;
//     halted.resolve();
//     future.reject(new Error("halted"));
//   };

//   scope.set(TrapContext, {
//     outcome: Nothing<Result<T>>(),
//   });

//   let routine = createCoroutine<void>({
//     scope,
//     *operation() {
//       routine.runLevel = 1;
//       halt = () => {
//         halt = () => {};
//         routine.runLevel = 2;
//         state.current.halted = true;
//         let trap = scope.expect(TrapContext);
//         trap.outcome = Nothing();
//         routine.return(Ok());
//       };

//       let trap = scope.expect(TrapContext) as Trap<T>;

//       let outcome = yield* trapset(trap, operation);

//       let finalization =
//         state.current.halted && outcome.exists && !outcome.value.ok
//           ? outcome.value
//           : Ok();

//       children.linked = false;

//       let destruction = yield* box(() => children.destroy());

//       finalization = !destruction.ok ? destruction : finalization;

//       link.finalized(task, outcome, finalization);

//       if (!state.current.halted) {
//         halted.resolve();
//         if (!finalization.ok) {
//           future.reject(finalization.error);
//         } else if (outcome.exists) {
//           const { value: result } = outcome;
//           if (result.ok) {
//             future.resolve(result.value);
//           } else {
//             future.reject(result.error);
//           }
//         } else {
//           future.reject(new Error("halted"));
//         }
//       } else {
//         future.reject(new Error("halted"));
//         if (finalization.ok) {
//           halted.resolve();
//         } else {
//           halted.reject(finalization.error);
//         }
//       }
//     },
//   });

//   let task = Object.defineProperties(future.future, {
//     halt: {
//       enumerable: false,
//       value() {
//         return Object.defineProperties(Object.create(Promise.prototype), {
//           [Symbol.iterator]: {
//             enumerable: false,
//             *value() {
//               halt();
//               yield* halted.future;
//             },
//           },
//           then: {
//             enumerable: false,
//             value(...args: Parameters<typeof halted.future["then"]>) {
//               halt();
//               return halted.future.then(...args);
//             },
//           },
//           catch: {
//             enumerable: false,
//             value(...args: Parameters<typeof halted.future["catch"]>) {
//               halt();
//               return halted.future.catch(...args);
//             },
//           },
//           finally: {
//             enumerable: false,
//             value(...args: Parameters<typeof halted.future["finally"]>) {
//               halt();
//               return halted.future.finally(...args);
//             },
//           },
//         });
//       },
//     },
//     [Symbol.iterator]: {
//       enumerable: false,
//       value: future.future[Symbol.iterator],
//     },
//     [Symbol.toStringTag]: {
//       enumerable: false,
//       value: "Task",
//     },
//   }) as Task<T>;

//   link.add(task);

//   let start = () => routine.next(Ok());

//   return { task, scope, routine, start };
// }

// const TaskLinkContext = createContext<TaskLink>("@effection/tasks", {
//   add() {},
//   finalized() {},
// });

// interface TaskLink {
//   add(task: Task<unknown>): void;
//   finalized(
//     task: Task<unknown>,
//     outcome: Maybe<Result<unknown>>,
//     finalization: Result<void>,
//   ): void;
// }

// class TaskTree implements TaskLink {
//   linked = true;
//   tasks = new Set<Task<unknown>>();
//   constructor(public crash: (error: Error) => void) {}
//   add(task: Task<unknown>) {
//     this.tasks.add(task);
//   }
//   finalized(
//     task: Task<unknown>,
//     outcome: Maybe<Result<unknown>>,
//     finalization: Result<void>,
//   ) {
//     this.tasks.delete(task);
//     if (this.linked) {
//       if (!finalization.ok) {
//         this.crash(finalization.error);
//       } else if (outcome.exists && !outcome.value.ok) {
//         this.crash(outcome.value.error);
//       }
//     }
//   }

//   *destroy() {
//     let result = Ok();
//     while (this.tasks.size > 0) {
//       let tasks = [...this.tasks].reverse();
//       for (let task of tasks) {
//         this.tasks.delete(task);
//       }
//       for (let task of tasks) {
//         try {
//           yield* task.halt();
//         } catch (error) {
//           result = Err(error as Error);
//         }
//       }
//     }
//     if (!result.ok) {
//       throw result.error;
//     }
//   }
// }

export function encapsulate<T>(op: () => Operation<T>): Operation<T> {
  return op();
}

export function trap<T>(op: () => Operation<T>): Operation<T> {
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
