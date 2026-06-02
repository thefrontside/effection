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

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Baseline measurement using native async/await. Creates a recursive async
function chain that bottoms out with 100 awaited Promise.resolve() calls.
This represents the minimal overhead of JavaScript's built-in async machinery,
providing a reference point for comparing structured concurrency libraries.
`.trim();
import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Recursive async function.
 */
async function recurse(depth: number, ctx: ScenarioCtx): Promise<void> {
  if (depth > 1) {
    await recurse(depth - 1, ctx);
  } else {
    // Peak: all `depth` async frames are alive here before the inner loop runs.
    ctx.markPeak();
    for (let i = 0; i < 100; i++) {
      await Promise.resolve();
    }
  }
}

/**
 * Wrapper that converts async to Operation.
 */
function* run(depth: number, ctx: ScenarioCtx): Operation<void> {
  yield* call(() => recurse(depth, ctx));
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
