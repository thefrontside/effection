import type { Operation, Task } from "./types.ts";
import type { DurableStream } from "./durable/types.ts";

import { createScope, global } from "./scope.ts";
import { ReducerContext } from "./reducer.ts";
import { DurableReducer } from "./durable/durable-reducer.ts";
import { InMemoryDurableStream } from "./durable/stream.ts";

/**
 * Options for configuring a durable run.
 */
export interface RunOptions {
  /**
   * A durable stream to record/replay effect resolutions.
   * When provided, the stream is used for persistence.
   * When omitted, an ephemeral in-memory stream is used
   * (all effects still go through the durable reducer,
   * but nothing is persisted between runs).
   */
  stream?: DurableStream;
}

/**
 * Execute an operation.
 *
 * Run is an entry point into Effection, and is especially useful when
 * embedding Effection code into existing code. However, If you are writing your
 * whole program using Effection, you should prefer {@link main}.
 *
 * All runs go through the DurableReducer which records effect resolutions
 * to a DurableStream. By default, an ephemeral in-memory stream is used.
 * Pass a persistent stream via `options.stream` to enable durable execution
 * that survives restarts.
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
 * @param options optional configuration including a DurableStream
 * @returns a task representing the running operation.
 * @since 3.0
 */
export function run<T>(
  operation: () => Operation<T>,
  options?: RunOptions,
): Task<T> {
  let stream = options?.stream ?? new InMemoryDurableStream();
  let reducer = new DurableReducer(stream);

  // Create a child scope from global and inject our DurableReducer.
  // All coroutines created within this scope (and its children) will
  // use our reducer instead of the default one.
  let [scope] = createScope(global);
  scope.set(ReducerContext, reducer);

  return scope.run(operation);
}
