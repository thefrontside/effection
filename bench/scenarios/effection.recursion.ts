/**
 * Effection recursion benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/effection.recursion.ts
 *
 * @module
 */

import { call, type Operation } from "effection";

import type { Scenario } from "./types.ts";

/**
 * Recursive operation that bottoms out with Promise.resolve() calls.
 */
function* recurse(depth: number): Operation<void> {
  if (depth > 1) {
    yield* recurse(depth - 1);
  } else {
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
