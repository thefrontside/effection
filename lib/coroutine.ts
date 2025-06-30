import { BoundaryContext } from "./boundary.ts";
import { Generation } from "./contexts.ts";
import { ReducerContext } from "./reducer.ts";
import { Ok } from "./result.ts";
import type { Coroutine, Operation, Scope } from "./types.ts";

export interface CoroutineOptions<T> {
  scope: Scope;
  operation(): Operation<T>;
}

export function createCoroutine<T>(
  { operation, scope }: CoroutineOptions<T>,
): Coroutine<T> {
  let reducer = scope.expect(ReducerContext);

  let iterator: Coroutine<T>["data"]["iterator"] | undefined = undefined;

  let routine = {
    runLevel: 0,
    scope,
    data: {
      get iterator() {
        if (!iterator) {
          iterator = operation()[Symbol.iterator]();
        }
        return iterator;
      },
      exit: (resolve) => resolve(Ok()),
    },
    next(result) {
      routine.data.exit((exitResult) => {
        routine.data.exit = (didExit) => didExit(Ok());
        const boundary = routine.scope.expect(BoundaryContext);
        reducer.reduce([
          scope.expect(Generation),
          routine,
          exitResult.ok ? result : exitResult,
          () => {},
          "next",
          routine.runLevel,
          boundary,
          boundary.runLevel,
        ]);
      });
    },
    return(result) {
      routine.data.exit((exitResult) => {
        routine.data.exit = (didExit) => didExit(Ok());
        const boundary = routine.scope.expect(BoundaryContext);
        reducer.reduce([
          scope.expect(Generation),
          routine,
          exitResult.ok ? result : exitResult,
          () => {},
          "return",
          routine.runLevel,
          boundary,
          boundary.runLevel,
        ]);
      });
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
