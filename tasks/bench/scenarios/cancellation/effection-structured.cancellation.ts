/**
 * Effection Structured Cancellation Benchmark
 *
 * Demonstrates Effection's core value proposition: automatic cancellation
 * through structured concurrency. When a scope exits, all spawned tasks
 * are automatically halted and their cleanup runs.
 *
 * Scenario:
 * - Spawn N concurrent worker tasks
 * - Each worker spawns nested sub-tasks up to depth D
 * - Each task allocates a "resource" (tracked via tracker.allocate())
 * - Cancel all by exiting the parent scope
 * - Verify all resources are released via finally blocks
 *
 * Key insight: No manual AbortController, no signal threading, no cleanup lists.
 * Scope exit = automatic cancellation cascade.
 */

import {
  call,
  type Operation,
  scoped,
  spawn,
  suspend,
} from "../../../../mod.ts";
import { cancellationScenario, type CancellationParams } from "./scenario.ts";
import { createBarrier, type Barrier, type ResourceTracker } from "./tracker.ts";

await cancellationScenario("effection-structured.cancellation", runBenchmark);

function* runBenchmark(params: CancellationParams): Operation<void> {
  const { tasks, depth, tracker } = params;
  
  // Calculate total expected allocations: each task allocates 1 resource per depth level
  // tasks * depth = total resources
  const totalAllocations = tasks * depth;
  const barrier = createBarrier(totalAllocations);

  // Use scoped() to create an explicit cancellation boundary.
  // When we exit this scope, all spawned work is automatically cancelled.
  yield* scoped(function* () {
    // Spawn all worker tasks
    for (let i = 0; i < tasks; i++) {
      yield* spawn(function* () {
        yield* worker(depth, tracker, barrier);
      });
    }

    // Wait for all workers (and their nested sub-workers) to allocate resources
    yield* call(() => barrier.wait());

    // Now cancel everything by exiting the scoped() block.
    // This is the key demonstration: we don't call halt() on each task,
    // we don't thread AbortSignals, we just... exit.
    // Effection's structured concurrency ensures all spawned tasks are halted
    // and their finally blocks run.
  });

  // At this point, all tasks have been cancelled and cleanup has run.
  // The tracker should show allocated === released (no leaks).
}

/**
 * A worker that allocates a resource and spawns nested sub-workers.
 * Cleanup happens in finally, which runs on normal exit, error, OR halt.
 */
function* worker(
  depth: number,
  tracker: ResourceTracker,
  barrier: Barrier,
): Operation<void> {
  // Allocate a resource
  tracker.allocate();

  try {
    if (depth > 1) {
      // Spawn a nested sub-worker (simulates task tree)
      yield* spawn(function* () {
        yield* worker(depth - 1, tracker, barrier);
      });
    }

    // Signal that this worker has allocated its resource
    yield* call(() => barrier.arrive());

    // Suspend indefinitely - this task will be halted by parent scope exit
    yield* suspend();
  } finally {
    // Release resource on cleanup (runs on halt, error, or normal exit)
    tracker.release();
  }
}
