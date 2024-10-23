import { lift } from "./lift.ts";
import { Err, Ok, Result, unbox } from "./result.ts";
import { Operation } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";
import { spawn } from "./spawn.ts";
import { encapsulate } from "./task.ts";

export function* callcc<T>(
  op: (
    resolve: (value: T) => Operation<void>,
    reject: (error: Error) => Operation<void>,
  ) => Operation<void>,
): Operation<T> {
  let result = withResolvers<Result<T>>();

  let resolve = lift((value: T) => result.resolve(Ok(value)));

  let reject = lift((error: Error) => result.resolve(Err(error)));

  return yield* encapsulate(function* () {
    yield* spawn(() => op(resolve, reject));

    return unbox(yield* result.operation);
  });
}
