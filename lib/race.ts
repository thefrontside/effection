import { spawn } from "./spawn.ts";
import { trap } from "./task.ts";
import type { Operation, Task, Yielded } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";
import { Err, Ok, type Result } from "./result.ts";

/**
 * Race the given operations against each other and return the value of
 * whichever operation returns first. This has the same purpose as
 * [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
 *
 * If an operation become errored first, then `race` will fail with this error.
 * After the first operation wins the race, all other operations will become
 * halted and therefore cannot throw any further errors.
 *
 * @example
 *
 * ```typescript
 * import { main, race, fetch } from 'effection';
 *
 * await main(function*() {
 *  let fastest = yield* race([fetch('http://google.com'), fetch('http://bing.com')]);
 *  // ...
 * });
 * ```
 *
 * @param operations a list of operations to race against each other
 * @returns the value of the fastest operation
 * @since 3.0
 */

export function* race<T extends Operation<unknown>>(
  operations: readonly T[],
): Operation<Yielded<T>> {
  let winner = withResolvers<Result<Yielded<T>>>("await winner");

  let tasks: Task<unknown>[] = [];

  // encapsulate the race in a hermetic scope.
  let result = yield* trap(function* () {
    for (let operation of operations.slice()) {
      tasks.push(
        yield* spawn(function* candidate() {
          try {
            let value = yield* operation;
            winner.resolve(Ok(value as Yielded<T>));
          } catch (error) {
            winner.resolve(Err(error as Error));
          }
        }),
      );
    }
    return yield* winner.operation;
  });

  let shutdown: Task<void>[] = [];

  for (let task of tasks) {
    shutdown.push(yield* spawn(task.halt));
  }

  for (let task of shutdown) {
    yield* task;
  }

  if (result.ok) {
    return result.value;
  } else {
    throw result.error;
  }
}
