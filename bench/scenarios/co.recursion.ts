/**
 * co recursion benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/co.recursion.ts
 *
 * @module
 */

import { call, type Operation } from "effection";

import co from "co";
import type { Scenario } from "./types.ts";

/**
 * Wrapper that runs co generator as an Effection operation.
 */
function* run(depth: number): Operation<void> {
  function* recurse(d: number): Generator<unknown, void> {
    if (d > 1) {
      yield recurse(d - 1);
    } else {
      for (let i = 0; i < 100; i++) {
        yield Promise.resolve();
      }
    }
  }
  yield* call(() => co(recurse, depth));
}

/**
 * co recursion scenario.
 */
export const coRecursion: Scenario = {
  name: "co.recursion",
  library: "co",
  type: "recursion",
  run,
};
