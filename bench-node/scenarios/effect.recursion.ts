/**
 * Effect recursion benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/effect.recursion.ts
 *
 * @module
 */

import { Effect } from "effect";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effect-TS overhead for deeply nested generator-based effects. Creates
a recursive chain using \`Effect.gen()\` that bottoms out with 100
\`Effect.promise()\` calls, testing fiber management and effect composition
efficiency.
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
 * Effect recursion scenario.
 */
export const effectRecursion: Scenario = {
  name: "effect.recursion",
  library: "effect",
  type: "recursion",
  run,
};
