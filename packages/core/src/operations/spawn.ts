import { Operation, OperationFunction } from '../operation';
import { Future } from '../future';
import type { Task, TaskOptions } from '../task';

interface Spawn<T> extends OperationFunction<Task<T>> {
  within(scope: Task): Operation<Task<T>>;
}

/**
 * An operation which spawns the given operation as a child of the current task.
 *
 * You should prefer using the spawn operation over calling `task.run` from
 * within Effection code. The reason being that a synchronous failure in the
 * spawned task will not be caught until the next yield point when using `run`,
 * which can be confusing. Additionally, using `spawn` is usually more
 * ergonomic.
 *
 * ### Example
 *
 * ```typescript
 * import { main, sleep, spawn } from 'effection';
 *
 * main(function*() {
 *   yield spawn(function*() {
 *     yield sleep(1000);
 *     console.log("hello");
 *   });
 *   yield spawn(function*() {
 *     yield sleep(2000);
 *     console.log("world");
 *   });
 *   yield;
 * });
 * ```
 *
 * @param operation the operation to run as a child of the current task
 * @typeParam T the type that the spawned task evaluates to
 */
export function spawn<T>(operation?: Operation<T>, options?: TaskOptions): Spawn<T> {
  function spawn(task: Task) {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `spawn` on a task without scope');
    }
    let result = scope.run(operation, options);
    return Future.resolve(result);
  }

  function within(scope: Task) {
    return scope.spawn(operation, options);
  }

  return Object.assign(spawn, { within });
}
