// deno-lint-ignore-file no-unsafe-finally
import { createContext } from "./context.ts";
import { Draining } from "./contexts.ts";
import { useCoroutine } from "./coroutine.ts";
import { Just, type Maybe, Nothing } from "./maybe.ts";
import { Err, Ok, type Result } from "./result.ts";
import type { Coroutine, Operation } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";

export class Delimiter<T>
  implements Operation<Maybe<Result<T>>>, ErrorBoundary {
  level = 0;
  finalized = false;
  future = withResolvers<Maybe<Result<T>>>();
  computed = false;
  routine?: Coroutine;
  outcome?: Maybe<Result<T>>;

  constructor(
    public readonly operation: () => Operation<T>,
    public readonly parent?: Delimiter<unknown>,
  ) {}

  raise(error: Error): void {
    let failure = Just(Err<T>(error));
    if (this.finalized) {
      this.parent?.exit(failure);
    } else {
      this.exit(failure);
    }
  }

  interrupt(): void {
    this.exit(Nothing());
  }

  *close(): Operation<void> {
    let done = this.future.operation;
    let interrupted = !this.computed;

    this.close = function* close() {
      let outcome = yield* done;
      if (interrupted && outcome.exists && !outcome.value.ok) {
        throw outcome.value.error;
      }
    };
    if (!this.outcome) {
      this.interrupt();
      yield* this.close();
    } else if (!this.finalized) {
      yield* this.close();
    } else {
      if (interrupted && this.outcome.exists && !this.outcome.value.ok) {
        throw this.outcome.value.error;
      }
    }
  }

  private exit(outcome: Maybe<Result<T>>): void {
    if (this.finalized) {
      return;
    }
    this.outcome =
      (this.outcome && this.outcome.exists && !this.outcome.value.ok)
        ? this.outcome
        : outcome;
    let scope = this.routine?.scope;
    if (scope?.get(Draining)) {
      // A shutdown is already in progress on this scope. The merged
      // outcome above will be observed by the in-flight drain when its
      // iterator reaches its finally. Firing a second routine.return
      // here would cut across the unwind.
      return;
    }
    if (!scope || !this.routine) {
      // The routine has not started yet. The outcome is recorded on
      // this.outcome; the iterator will see it on entry and skip
      // running the operation, going straight to its finally. We must
      // NOT bump level here — the start() instruction is already in
      // the reducer queue and would be invalidated by a level mismatch,
      // leaving the routine permanently unscheduled.
      return;
    }
    // Bumping level invalidates stale instructions queued for this
    // routine; do it only when we actually fire the return that drains
    // the routine.
    this.level++;
    scope.set(Draining, true);
    this.routine.return(Ok(this.outcome));
  }

  get validator(): () => boolean {
    let { level } = this;
    return () => !this.finalized && this.level === level;
  }

  [Symbol.iterator] = function* delimiter(this: Delimiter<T>) {
    this.routine = yield* useCoroutine();

    try {
      if (!this.outcome) {
        let value = yield* this.operation();
        if (this.level === 0) {
          this.computed = true;
          this.outcome = Just(Ok(value));
        }
      }
    } catch (error) {
      this.computed = true;
      this.outcome = Just(Err(error as Error));
    } finally {
      this.finalized = true;
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
