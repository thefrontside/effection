import type { Operation, Task } from "./types.ts";

import { global } from "./scope.ts";

/**
 * Execute an operation.
 *
 * Run is an entry point into Effection, and is especially useful when
 * embedding Effection code into existing code. However, If you are writing your
 * whole program using Effection, you should prefer {@link main}.
 *
 * @example
 * ```javascript
 * import { run, sleep } from 'effection';
 *
 * let result = await run(function*() {
 *   yield* sleep(100);
 *   return 'hello';
 * });
 *
 * console.log(result); // 'hello'
 * ```
 *
 * Run will create a new top-level scope for the operation. However, to run an
 * operation in an existing scope, you can use {@link Scope.run}.
 *
 * @param operation the operation to run
 * @returns a task representing the running operation.
 * @since 3.0
 */
export function run<T>(operation: () => Operation<T>): Task<T> {
  return global.run(operation);
}
