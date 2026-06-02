/**
 * Effect v4 recursion benchmark scenario.
 *
 * Mirror of effect.recursion.ts but pinned to Effect v4 via the `effect-v4`
 * npm alias. The v4 generator-effect API is largely shape-compatible with v3
 * for this scenario.
 *
 * @module
 */

// `effect-v4` is an npm alias to effect@4 declared both in the project
// deno.json (for top-level type-check) and in the workspace package.json
// (for runtime resolution).
import { Effect } from "effect-v4";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effect v4 (beta) overhead for deeply nested generator-based effects.
Mirrors the Effect v3 recursion scenario so the two majors are directly
comparable.
`.trim();

import { call, type Operation } from "effection";
import type { Scenario } from "./types.ts";

/**
 * Recursive Effect.
 */
function recurse(depth: number): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    if (depth > 1) {
      yield* recurse(depth - 1);
    } else {
      for (let i = 0; i < 100; i++) {
        yield* Effect.promise(() => Promise.resolve());
      }
    }
  });
}

/**
 * Wrapper that runs Effect as an Effection operation.
 */
function* run(depth: number): Operation<void> {
  yield* call(() => Effect.runPromise(recurse(depth)));
}

/**
 * Effect v4 recursion scenario.
 */
export const effectV4Recursion: Scenario = {
  name: "effect-v4.recursion",
  library: "effect-v4",
  type: "recursion",
  run,
};
