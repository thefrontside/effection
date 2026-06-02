/**
 * Effect events benchmark scenario.
 *
 * Uses native EventTarget with Effect's Stream.fromEventListener for
 * fair comparison with other event benchmarks.
 *
 * @module
 */

import { Effect, Fiber, Stream } from "effect";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effect-TS event handling with native EventTarget. Uses
Stream.fromEventListener to create recursive event listeners that propagate
events through a nested chain. Tests Stream subscription overhead, fiber
forking, and scoped resource cleanup with native browser-like events.
`.trim();

import { call, type Operation } from "effection";
import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Run the Effect events benchmark. `ctx` is captured by closure and used to
 * mark peak memory after all events have been dispatched and before fiber
 * interruption tears the chain down.
 */
const effectRun = (depth: number, ctx: ScenarioCtx): Effect.Effect<void> =>
  Effect.gen(function* () {
    const target = new EventTarget();

    // Spawn recursive listener
    const fiber = yield* Effect.fork(recurse(target, depth));

    // Ensure listeners are registered before dispatching
    yield* Effect.yieldNow();

    // Dispatch 100 events (same as other benchmarks)
    for (let i = 0; i < 100; i++) {
      yield* Effect.yieldNow();
      target.dispatchEvent(new Event("foo"));
    }

    // Peak: full chain of `depth` Stream subscriptions is alive and 100
    // events have propagated; fiber teardown hasn't started.
    ctx.markPeak();

    yield* Effect.yieldNow();

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
    // Create a stream from native EventTarget
    const eventStream = Stream.fromEventListener<Event>(target, "foo");

    if (depth > 1) {
      const subTarget = new EventTarget();
      const subFiber = yield* Effect.fork(recurse(subTarget, depth - 1));

      // Ensure sub-listener is registered
      yield* Effect.yieldNow();

      // Forward events to sub-target
      yield* Stream.runForEach(eventStream, () =>
        Effect.sync(() => subTarget.dispatchEvent(new Event("foo")))
      ).pipe(
        Effect.onInterrupt(() => Fiber.interrupt(subFiber))
      );
    } else {
      // Bottom - just consume events
      yield* Stream.runForEach(eventStream, () => Effect.void);
    }
  });
}

/**
 * Wrapper that runs Effect as an Effection operation.
 */
function* run(depth: number, ctx: ScenarioCtx): Operation<void> {
  yield* call(() => Effect.runPromise(effectRun(depth, ctx)));
}

/**
 * Effect events scenario.
 */
export const effectEvents: Scenario = {
  name: "effect.events",
  library: "effect",
  type: "events",
  run,
};
