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

import type { Scenario } from "./types.ts";

/**
 * Recursive operation using inline() instead of yield*.
 *
 * Note: inline() returns unknown, requiring a cast. This is the trade-off
 * for eliminating generator frame overhead.
 */
function* recurse(depth: number): Operation<void> {
  if (depth > 1) {
    (yield inline(recurse(depth - 1))) as void;
  } else {
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
