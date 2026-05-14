// deno-lint-ignore-file no-unsafe-finally
import { createContext } from "./context.ts";
import { type StepType, useCoroutine } from "./coroutine.ts";
import { Just, type Maybe, Nothing } from "./maybe.ts";
import { Err, Ok, type Result } from "./result.ts";
import type { Coroutine, Operation } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";

export class Delimiter<T>
  implements Operation<Maybe<Result<T>>>, ErrorBoundary {
  state: "running" | "cancelling" | "finalized" = "running";
  epoch = 0;
  computed = false;
  future = withResolvers<Maybe<Result<T>>>();
  routine?: Coroutine;
  outcome?: Maybe<Result<T>>;

  constructor(
    public readonly operation: () => Operation<T>,
    public readonly parent?: Delimiter<unknown>,
  ) {}

  nextStep(result: Result<unknown>, epoch: number): StepType {
    if (this.epoch !== epoch || this.state === "finalized") {
      return "drop";
    } else if (!result.ok) {
      return "throw";
    } else if (this.state === "cancelling") {
      this.state = "running";
      return "return";
    } else {
      return "next";
    }
  }

  raise(error: Error): void {
    let failure = Just(Err<T>(error));
    if (this.state === "finalized") {
      this.parent?.signal(failure);
    } else {
      this.signal(failure);
    }
  }

  interrupt(): void {
    this.signal(Nothing());
  }

  *close(): Operation<void> {
    let done = this.future.operation;

    this.close = function* close() {
      let outcome = yield* done;
      if (this.epoch > 0 && outcome.exists && !outcome.value.ok) {
        throw outcome.value.error;
      }
    };
    if (!this.outcome) {
      this.interrupt();
      yield* this.close();
    } else {
      if (this.epoch > 0 && this.outcome.exists && !this.outcome.value.ok) {
        throw this.outcome.value.error;
      }
    }
  }

  private signal(outcome: Maybe<Result<T>>): void {
    if (this.state === "finalized" || this.epoch > 0) return;

    this.outcome = outcome;
    this.state = "cancelling";
    this.epoch++;
    if (!this.routine) {
      this.state = "finalized";
      this.future.resolve(this.outcome);
    } else {
      this.routine.next(Ok(this.outcome));
    }
  }

  [Symbol.iterator] = function* delimiter(this: Delimiter<T>) {
    try {
      this.routine = yield* useCoroutine();
      let value = yield* this.operation();
      if (this.epoch === 0) {
        this.computed = true;
        this.outcome = Just(Ok(value));
      }
    } catch (error) {
      this.computed = true;
      this.outcome = Just(Err(error as Error));
    } finally {
      this.state = "finalized";
      this.outcome = this.outcome ?? Nothing();
      this.future.resolve(this.outcome);
      return this.outcome;
    }
  };
}

export const DelimiterContext = createContext<Delimiter<unknown>>(
  "@effection/delimiter",
);

export interface ErrorBoundary {
  raise(error: Error): void;
}

export const ErrorContext = createContext<ErrorBoundary>(
  "@effection/boundary",
  {
    raise: () => {},
  },
);
