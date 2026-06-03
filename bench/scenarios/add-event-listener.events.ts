/**
 * addEventListener events benchmark scenario.
 *
 * Baseline comparison using native addEventListener.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/add-event-listener.events.ts
 *
 * @module
 */

import { call, type Operation } from "effection";

import type { Scenario } from "./types.ts";

/**
 * Run the native addEventListener events benchmark.
 */
async function runAsync(depth: number): Promise<void> {
  const target = new EventTarget();
  const c = new AbortController();
  const promised = recurse(target, c.signal, depth);
  for (let i = 0; i < 100; i++) {
    await Promise.resolve();
    target.dispatchEvent(new Event("foo"));
  }
  await Promise.resolve();
  c.abort();
  await promised;
}

/**
 * Recursive addEventListener chain.
 */
async function recurse(
  target: EventTarget,
  signal: AbortSignal,
  depth: number,
): Promise<void> {
  let abort: (() => void) | undefined;
  let handler: (() => void) | undefined;
  let resolve: (() => void) | undefined;
  let promise: Promise<void> | undefined;

  function finalize() {
    if (abort) {
      signal.removeEventListener("abort", abort);
      abort = undefined;
    }
    if (handler) {
      target.removeEventListener("foo", handler);
      handler = undefined;
    }
    if (resolve) {
      resolve();
      resolve = undefined;
    }
  }

  if (depth > 0) {
    const subTarget = new EventTarget();
    const subPromise = recurse(subTarget, signal, depth - 1);
    handler = function handler() {
      subTarget.dispatchEvent(new Event("foo"));
    };
    target.addEventListener("foo", handler);

    // Add cleanup on abort (matching depth === 0 pattern for parity)
    abort = () => {
      target.removeEventListener("foo", handler!);
      signal.removeEventListener("abort", abort!);
    };
    signal.addEventListener("abort", abort);

    await subPromise;
  } else {
    promise = new Promise<void>((r) => (resolve = r));
    abort = finalize;
    handler = function handler() {
      // bottom of recursion
    };
    target.addEventListener("foo", handler);
    signal.addEventListener("abort", abort);
    await promise;
  }
}

/**
 * Wrapper that runs async function as an Effection operation.
 */
function* run(depth: number): Operation<void> {
  yield* call(() => runAsync(depth));
}

/**
 * addEventListener events scenario.
 */
export const addEventListenerEvents: Scenario = {
  name: "add-event-listener.events",
  library: "addEventListener",
  type: "events",
  run,
};
