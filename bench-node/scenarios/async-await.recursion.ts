/**
 * async/await recursion benchmark scenario.
 *
 * Baseline comparison using native async/await.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/async+await.recursion.ts
 *
 * @module
 */

import { call, type Operation } from "effection";

import type { Scenario } from "./types.ts";

/**
 * Recursive async function.
 */
async function recurse(depth: number): Promise<void> {
  if (depth > 1) {
    await recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      await Promise.resolve();
    }
  }
}

/**
 * Wrapper that converts async to Operation.
 */
function* run(depth: number): Operation<void> {
  yield* call(() => recurse(depth));
}

/**
 * async/await recursion scenario.
 */
export const asyncAwaitRecursion: Scenario = {
  name: "async-await.recursion",
  library: "async-await",
  type: "recursion",
  run,
};
