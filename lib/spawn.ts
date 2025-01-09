import { Ok } from "./result.ts";
import type { ScopeInternal } from "./scope-internal.ts";
import { createTask, type NewTask } from "./task.ts";
import type { Effect, Operation, Task } from "./types.ts";

/**
 * Run another operation concurrently as a child of the current one.
 *
 * The spawned operation will begin executing immediately and control will
 * return to the caller when it reaches its first suspend
 *
 * @example
 * ```js
 * import { main, sleep, suspend, spawn } from 'effection';
 *
 * await main(function*() {
 *   yield* spawn(function*() {
 *     yield* sleep(1000);
 *     console.log("hello");
 *   });
 *   yield* spawn(function*() {
 *     yield* sleep(2000);
 *     console.log("world");
 *   });
 *   yield* suspend();
 * });
 * ```
 *
 * You should prefer using the spawn operation over calling
 * {@link Scope.run} from within Effection code. The reason being that a
 * synchronous failure in the spawned operation will not be caught
 * until the next yield point when using `run`, which results in lines
 * being executed that should not.
 *
 * @example
 * ```js
 * import { main, suspend, spawn, useScope } from 'effection';
 *
 * await main(function*() {
 *   yield* useScope();
 *
 *   scope.run(function*() {
 *    throw new Error('boom!');
 *   });
 *
 *   console.log('this code will run and probably should not');
 *
 *   yield* suspend(); // <- error is thrown after this.
 * });
 * ```
 * @param operation the operation to run as a child of the current task
 * @typeParam T the type that the spawned task evaluates to
 * @returns a {@link Task} representing a handle to the running operation
 */
export function* spawn<T>(op: () => Operation<T>): Operation<Task<T>> {
  let { task, start } = (yield Spawn(op)) as NewTask<T>;
  start();
  return task;
}

function Spawn<T>(operation: () => Operation<T>): Effect<NewTask<T>> {
  return {
    description: `spawn(${operation.name})`,
    enter: (resolve, { scope }) => {
      resolve(Ok(createTask({ owner: scope as ScopeInternal, operation })));
      return (done) => {
        done(Ok());
      };
    },
  };
}
