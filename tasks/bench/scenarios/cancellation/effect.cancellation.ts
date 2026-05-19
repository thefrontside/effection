/**
 * Effect.js Fiber Interruption Cancellation Benchmark
 *
 * Demonstrates Effect's approach to cancellation using fiber interruption.
 * Effect has structured concurrency via its fiber model:
 *
 * 1. Fibers form a hierarchy (parent-child relationships)
 * 2. Interrupting a parent fiber cascades to children
 * 3. Finalizers run on interruption
 * 4. Effect.acquireRelease manages resource lifecycle
 *
 * This is conceptually similar to Effection but with different ergonomics:
 * - Effect uses Effect.gen with yield* (similar to Effection generators)
 * - Effect.fork spawns concurrent fibers
 * - Effect.interrupt/Fiber.interrupt for cancellation
 * - Effect.acquireRelease for resource cleanup
 */

import { Effect, Fiber, type Scope } from "npm:effect";
import { call } from "../../../../mod.ts";
import { type CancellationParams, cancellationScenario } from "./scenario.ts";
import {
  type Barrier,
  createBarrier,
  type ResourceTracker,
} from "./tracker.ts";

await cancellationScenario(
  "effect.cancellation",
  (params) => call(() => runBenchmark(params)),
);

async function runBenchmark(params: CancellationParams): Promise<void> {
  const { tasks, depth, tracker } = params;

  // Calculate total expected allocations
  const totalAllocations = tasks * depth;
  const barrier = createBarrier(totalAllocations);

  const program = Effect.gen(function* () {
    // Track fibers for the final wait
    const fibers: Fiber.RuntimeFiber<void, never>[] = [];

    // Fork all worker fibers
    for (let i = 0; i < tasks; i++) {
      const fiber = yield* Effect.fork(worker(depth, tracker, barrier));
      fibers.push(fiber);
    }

    // Wait for all workers to allocate resources
    yield* Effect.promise(() => barrier.wait());

    // Interrupt all fibers - this cascades to children
    // Effect's structured concurrency ensures finalizers run
    yield* Effect.forEach(
      fibers,
      (fiber: Fiber.RuntimeFiber<void, never>) => Fiber.interrupt(fiber),
      { concurrency: "unbounded" },
    );
  });

  // Run with a scope that handles cleanup
  await Effect.runPromise(Effect.scoped(program));
}

/**
 * Worker effect that allocates a resource and spawns nested children.
 * Uses Effect.acquireRelease for resource lifecycle management.
 */
function worker(
  depth: number,
  tracker: ResourceTracker,
  barrier: Barrier,
): Effect.Effect<void, never, Scope.Scope> {
  return Effect.gen(function* () {
    // Acquire resource with guaranteed release
    yield* Effect.acquireRelease(
      // Acquire: allocate the resource
      Effect.sync(() => {
        tracker.allocate();
      }),
      // Release: runs on success, failure, or interruption
      () =>
        Effect.sync(() => {
          tracker.release();
        }),
    );

    if (depth > 1) {
      // Fork a child fiber - it inherits the scope
      yield* Effect.fork(worker(depth - 1, tracker, barrier));
    }

    // Signal that this worker has allocated
    yield* Effect.promise(() => barrier.arrive());

    // Suspend indefinitely - will be interrupted
    yield* Effect.never;
  });
}
