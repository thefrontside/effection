/**
 * Effection recursion benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/effection.recursion.ts
 *
 * @module
 */

import { call, type Operation } from "effection";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effection's structured concurrency overhead for deeply nested generator
calls. Creates a recursive chain of operations that bottoms out with 100
Promise.resolve() calls, testing how efficiently Effection manages operation
lifecycles and context propagation through the call stack.
`.trim();
import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Recursive operation that bottoms out with Promise.resolve() calls.
 */
function* recurse(depth: number, ctx: ScenarioCtx): Operation<void> {
  if (depth > 1) {
    yield* recurse(depth - 1, ctx);
  } else {
    // Peak: all `depth` Operation frames are suspended on the task tree.
    ctx.markPeak();
    for (let i = 0; i < 100; i++) {
      yield* call(() => Promise.resolve());
    }
  }
}

/**
 * Effection recursion scenario.
 */
export const effectionRecursion: Scenario = {
  name: "effection.recursion",
  library: "effection",
  type: "recursion",
  run: recurse,
};
