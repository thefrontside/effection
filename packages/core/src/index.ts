import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { Effection } from './effection';

export { State, StateTransition } from './state-machine';
export { createTask, Task, TaskOptions, TaskInfo, TaskTree } from './task';
export { Operation, Resource } from './operation';
export { Effection } from './effection';
export { deprecated } from './deprecated';
export { Labels, withLabels, setLabels } from './labels';
export { HasEffectionTrace } from './error';
export { createFuture, Future, FutureLike } from './future';
export { createAbortSignal, AbortSignal } from './abort-signal';
export { Symbol } from './symbol';

export { sleep } from './operations/sleep';
export { ensure } from './operations/ensure';
export { timeout } from './operations/timeout';
export { withTimeout } from './operations/with-timeout';
export { spawn } from './operations/spawn';
export { race } from './operations/race';
export { all } from './operations/all';
export { label } from './operations/label';

/**
 * Run takes an operation and runs it in a task. It returns the task it created.
 *
 * Run is an entry point into Effection, and is especially useful when
 * embedding Effection code into existing code. If you are writing your whole
 * program using Effection, you should prefer using `main`.
 *
 * ### Example
 *
 * ```
 * import { run, fetch } from 'effection';
 *
 * async function fetchExample() {
 *   await run(function*() {
 *     let response = yield fetch('http://www.example.com');
 *     yield response.text();
 *   });
 * });
 * ```
 *
 * @param operation the operation to run
 * @param options the options to configure the task with
 * @returns the new task
 */
export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  return Effection.root.run(operation, options);
}
