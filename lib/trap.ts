import { createContext } from "./context.ts";
import { useCoroutine } from "./coroutine.ts";
import { Just, Nothing } from "./maybe.ts";
import { Err, Ok, type Result } from "./result.ts";
import { useScope } from "./scope.ts";
import type { Coroutine, Effect, Operation } from "./types.ts";

export function* trap<T>(operation: () => Operation<T>): Operation<T> {
  let scope = yield* useScope();
  let original = scope.expect(ErrorContext);
  let routine = yield* useCoroutine();
  let trap = new Trap<T>(routine);

  scope.set(ErrorContext, trap);

  try {
    let value = yield* operation();
    if (!trap.outcome.exists) {
      trap.outcome = Just(Ok(value));
    }
  } catch (error) {
    trap.outcome = Just(Err(error as Error));
  } finally {
    scope.set(ErrorContext, original);
    // deno-lint-ignore no-unsafe-finally
    return (yield trap.exit()) as T;
  }
}

export class Trap<T> implements ErrorBoundary {
  outcome = Nothing<Result<T>>();

  constructor(public routine: Coroutine<unknown>) {}

  raise(error: Error): void {
    this.outcome = Just(Err(error));
    this.routine.unwind();
  }

  exit(): Effect<T> {
    return {
      description: "exit this trap. throw if a background error was raised",
      enter: (resolve, routine) => {
        if (this.outcome.exists) {
          let result = this.outcome.value;
          resolve(result);
        } else {
          routine.unwind();
        }
        return (didExit) => didExit(Ok());
      },
    };
  }
}

export interface ErrorBoundary {
  raise(error: Error): void;
}

export const ErrorContext = createContext<ErrorBoundary>(
  "@effection/error-boundary",
  {
    raise() {},
  },
);
