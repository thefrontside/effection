import type { Operation, Task } from "./types.ts";
import { createFrame } from "./run/frame.ts";
export * from "./run/scope.ts";

/**
 * Execute an operation.
 *
 * Run is an entry point into Effection, and is especially useful when
 * embedding Effection code into existing code. However, If you are writing your
 * whole program using Effection, you should prefer {@link main}.
 *
 * @example
 * ```javascript
 * import { run, useAbortSignal } from 'effection';
 *
 * async function fetchExample() {
 *   await run(function*() {
 *     let signal = yield* useAbortSignal();
 *     let response = yield* fetch('http://www.example.com', { signal });
 *     yield* response.text();
 *   });
 * });
 * ```
 *
 * Run will create a new top-level scope for the operation. However, to run an
 * operation in an existing scope, you can use {@link Scope.run}.
 *
 * @param operation the operation to run
 * @returns a task representing the running operation.
 */
export function run<T>(operation: () => Operation<T>): Task<T> {
  let frame = createFrame<T>({ operation });
  frame.enter();
  return frame.getTask();
}
