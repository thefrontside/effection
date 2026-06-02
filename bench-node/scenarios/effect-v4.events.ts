/**
 * Effect v4 events benchmark scenario.
 *
 * Mirror of effect.events.ts but pinned to Effect v4 via the `effect-v4`
 * npm alias. Uses native EventTarget with Stream.fromEventListener for fair
 * comparison with other event benchmarks.
 *
 * v4 API differences vs v3:
 * - `Effect.fork` was replaced by `Effect.forkChild` (the closest
 *   "give me a Fiber I'll interrupt later" primitive in v4).
 * - `Effect.void` was removed; we use `Effect.sync(() => {})` instead.
 *
 * @module
 */

// `effect-v4` is an npm alias to effect@4 declared both in the project
// deno.json (for top-level type-check) and in the workspace package.json
// (for runtime resolution).
import { Effect, Fiber, Stream } from "effect-v4";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effect v4 (beta) event handling with native EventTarget. Mirrors the
Effect v3 events scenario so the two majors are directly comparable.
`.trim();

import { call, type Operation } from "effection";
import type { Scenario } from "./types.ts";

/**
 * Run the Effect v4 events benchmark.
 */
const effectRun = (depth: number): Effect.Effect<void> =>
  Effect.gen(function* () {
    const target = new EventTarget();

    // Spawn recursive listener
    const fiber = yield* Effect.forkChild(recurse(target, depth));

    // Ensure listeners are registered before dispatching
    yield* Effect.yieldNow;

    // Dispatch 100 events (same as other benchmarks)
    for (let i = 0; i < 100; i++) {
      yield* Effect.yieldNow;
      target.dispatchEvent(new Event("foo"));
    }


    yield* Effect.yieldNow;

    // Interrupt the fiber to trigger cleanup
    yield* Fiber.interrupt(fiber);
  });

/**
 * Recursive Effect event listener chain using Stream.fromEventListener.
 */
function recurse(
  target: EventTarget,
  depth: number,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    // Create a stream from native EventTarget (structurally satisfies
    // v4's EventListener<A> interface).
    const eventStream = Stream.fromEventListener<Event>(target, "foo");

    if (depth > 1) {
      const subTarget = new EventTarget();
      const subFiber = yield* Effect.forkChild(recurse(subTarget, depth - 1));

      // Ensure sub-listener is registered
      yield* Effect.yieldNow;

      // Forward events to sub-target
      yield* Stream.runForEach(eventStream, () =>
        Effect.sync(() => subTarget.dispatchEvent(new Event("foo")))
      ).pipe(
        Effect.onInterrupt(() => Fiber.interrupt(subFiber))
      );
    } else {
      // Bottom — just consume events
      yield* Stream.runForEach(eventStream, () => Effect.sync(() => {}));
    }
  });
}

/**
 * Wrapper that runs Effect as an Effection operation.
 */
function* run(depth: number): Operation<void> {
  yield* call(() => Effect.runPromise(effectRun(depth)));
}

/**
 * Effect v4 events scenario.
 */
export const effectV4Events: Scenario = {
  name: "effect-v4.events",
  library: "effect-v4",
  type: "events",
  run,
};
