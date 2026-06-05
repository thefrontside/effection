import { ReducerContext } from "./reducer.ts";
import { Err, Ok } from "./result.ts";
import type { Coroutine, Effect, Operation, Scope } from "./types.ts";
import type { Maybe } from "./maybe.ts";
import type { Result } from "./result.ts";
import { createContext } from "./context.ts";
import { createFuture } from "./future.ts";

export type StepType = "next" | "return" | "throw" | "drop";

export interface CoroutineOptions<T> {
  scope: Scope;
  operation(): Operation<T>;
}

export function createCoroutine<T>(
  { operation, scope }: CoroutineOptions<T>,
): Coroutine<T> {
  let reducer = scope.expect(ReducerContext);

  let iterator: Iterator<Effect<unknown>, T, unknown> | undefined = undefined;
  let { future, resolve: settle } = createFuture<Maybe<Result<T>>>();

  let resolver: Coroutine<T>["resume"] | null = null;

  let routine = {
    scope,
    future,
    settle: (outcome) => {
      resolver = null;
      settle(outcome);
    },
    data: {
      get iterator() {
        if (!iterator) {
          iterator = operation()[Symbol.iterator]();
        }
        return iterator;
      },
      set iterator(value) {
        iterator = value;
      },
      exit: (resolve) => resolve(Ok()),
      resumeWith: Ok(),
      enqueued: false,
      critical: false,
      unwinding: false,
    },
    resume(result) {
      resolver = null;
      routine.data.exit((exitResult) => {
        routine.data.exit = (didExit) => didExit(Ok());

        routine.data.resumeWith = exitResult.ok ? result : exitResult;

        reducer.schedule(routine);
      });
    },
    unwind() {
      routine.data.unwinding = true;
      if (!routine.data.critical) {
        routine.resume(Ok());
      }
    },
    step(): IteratorResult<Effect<unknown>, T> {
      if (!iterator) {
        iterator = operation()[Symbol.iterator]();
      }

      let { data } = this;

      let { resumeWith } = routine.data;
      if (!resumeWith.ok) {
        data.unwinding = false;
        if (iterator.throw) {
          return iterator.throw(resumeWith.error);
        } else {
          throw resumeWith.error;
        }
      } else if (data.unwinding && !data.critical) {
        data.unwinding = false;
        return iterator.return
          ? iterator.return()
          : { done: true, value: undefined as unknown as T };
      }
      return iterator.next(resumeWith.value);
    },
    perform(effect) {
      let resolve = resolver = (result) => {
        if (resolver === resolve) {
          resolver = null;
          routine.resume(result);
        }
      };
      try {
        routine.data.exit = effect.enter(resolve, routine);
      } catch (error) {
        routine.resume(Err(error));
      }
    },
  } as Coroutine<T>;

  return routine;
}

export function* useCoroutine(): Operation<Coroutine> {
  return (yield {
    description: "useCoroutine()",
    enter: (resolve, routine) => {
      resolve(Ok(routine));
      return (uninstalled) => uninstalled(Ok());
    },
  }) as Coroutine;
}

export interface Settleware {
  (
    outcome: Maybe<Result<unknown>>,
    next: (outcome: Maybe<Result<unknown>>) => void,
  ): void;
}

export const SettleContext = createContext<Settleware>(
  "@effection/coroutine.settle",
  (outcome, next) => next(outcome),
);

export function* critical<T>(operation: () => Operation<T>): Operation<T> {
  let routine = yield* useCoroutine();
  let original = routine.data.critical;
  routine.data.critical = true;
  try {
    return yield* operation();
  } finally {
    routine.data.critical = original;
  }
}
