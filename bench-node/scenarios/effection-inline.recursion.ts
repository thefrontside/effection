/**
 * Effection with inline() optimization - recursion benchmark scenario.
 *
 * Uses the @effectionx/inline plugin to collapse nested yield* delegation
 * into a flat iterator loop, eliminating O(depth) generator frame unwinding.
 *
 * @module
 */

import { call, type Operation } from "effection";
import { inline } from "@effectionx/inline";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effection's performance when using the inline() optimization.
The inline() function replaces nested generator delegation with an explicit
iterator stack, collapsing O(depth) frame unwinding to O(1). This shows
the potential performance gain from opting into the optimization on hot paths.
`.trim();

import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Recursive operation using inline() instead of yield*.
 *
 * Note: inline() returns unknown, requiring a cast. This is the trade-off
 * for eliminating generator frame overhead.
 */
function* recurse(depth: number, ctx: ScenarioCtx): Operation<void> {
  if (depth > 1) {
    (yield inline(recurse(depth - 1, ctx))) as void;
  } else {
    // Peak: inline() collapses generator frames, but the iterator stack still
    // holds `depth` entries here before the inner loop runs.
    ctx.markPeak();
    for (let i = 0; i < 100; i++) {
      yield* call(() => Promise.resolve());
    }
  }
}

/**
 * Effection inline recursion scenario.
 */
export const effectionInlineRecursion: Scenario = {
  name: "effection-inline.recursion",
  library: "effection-inline",
  type: "recursion",
  run: recurse,
};
