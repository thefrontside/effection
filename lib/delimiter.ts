// deno-lint-ignore-file no-unsafe-finally
import { Just, type Maybe, Nothing } from "./maybe.ts";
import { Err, Ok, type Result } from "./result.ts";
import type { Coroutine, Operation } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";

export class Delimiter<T> implements Operation<Maybe<Result<T>>> {
  level = 0;
  outcome = withResolvers<Maybe<Result<T>>>();
  computed = false;
  then: (outcome: Maybe<Result<T>>) => void = () => {};

  constructor(
    public readonly operation: () => Operation<T>,
    public routine?: Coroutine,
  ) {}

  exit(outcome: Maybe<Result<T>>, override = false): void {
    if (this.level === 0) {
      this.outcome.resolve(outcome);
    } else if (override || this.level++ === 1) {
      this.routine?.return(Ok(outcome));
    }
  }

  *close(): Operation<void> {
    let done = this.outcome.operation;
    let interrupted = !this.computed; 
    this.close = function* close() {
      let outcome = yield* done;
      if (interrupted && outcome.exists && !outcome.value.ok) {
        throw outcome.value.error;
      }
    };
    this.exit(Nothing());
    yield* this.close();
  }

  [Symbol.iterator] = function* delimiter(this: Delimiter<T>) {
    let outcome = Nothing<Result<T>>();
    try {
      this.level = 1;
      let value = yield* this.operation();
      if (this.level === 1) {
	this.computed = true;
        outcome = Just(Ok(value));
      }
    } catch (error) {
      this.computed = true;
      outcome = Just(Err(error as Error));
    } finally {
      this.outcome.resolve(outcome);
      this.then(outcome);
      return outcome;
    }
  };
}
