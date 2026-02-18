/**
 * Async/Await + AbortController Cancellation Benchmark
 *
 * Demonstrates the manual approach to cancellation without structured concurrency.
 * This shows what developers must write when using vanilla async/await:
 *
 * 1. Create and manage AbortController hierarchy manually
 * 2. Thread AbortSignal through every function call
 * 3. Check signal.aborted at every suspension point
 * 4. Register cleanup callbacks with signal.addEventListener
 * 5. Remember to call controller.abort() to trigger cancellation
 *
 * Contrast with Effection: scope exit = automatic cascade, no signal threading.
 */

import { call } from "../../../../mod.ts";
import { cancellationScenario, type CancellationParams } from "./scenario.ts";
import { createBarrier, type Barrier, type ResourceTracker } from "./tracker.ts";

await cancellationScenario(
  "async+abort.cancellation",
  (params) => call(() => runBenchmark(params)),
);

async function runBenchmark(params: CancellationParams): Promise<void> {
  const { tasks, depth, tracker } = params;

  // Calculate total expected allocations
  const totalAllocations = tasks * depth;
  const barrier = createBarrier(totalAllocations);

  // Manual: Create a root AbortController
  const controller = new AbortController();
  const { signal } = controller;

  // Manual: Track all worker promises so we can wait for cleanup
  const workers: Promise<void>[] = [];

  // Spawn all workers, threading the signal through
  for (let i = 0; i < tasks; i++) {
    workers.push(worker(depth, tracker, barrier, signal));
  }

  // Wait for all workers to allocate their resources
  await barrier.wait();

  // Manual: Trigger cancellation by aborting the controller
  controller.abort();

  // Manual: Wait for all workers to complete cleanup
  // This is critical and easy to forget - if we don't wait,
  // cleanup may not complete before we check the tracker
  await Promise.allSettled(workers);
}

/**
 * A worker that allocates a resource and spawns nested sub-workers.
 * Must manually:
 * 1. Accept AbortSignal as parameter
 * 2. Check signal.aborted at suspension points
 * 3. Register cleanup with signal.addEventListener
 * 4. Thread signal to child workers
 */
async function worker(
  depth: number,
  tracker: ResourceTracker,
  barrier: Barrier,
  signal: AbortSignal,
): Promise<void> {
  // Allocate a resource
  tracker.allocate();

  // Manual: Track child workers for cleanup
  const children: Promise<void>[] = [];

  // Manual: Set up cleanup handler - must use addEventListener pattern
  // because there's no finally block for async functions that handles abort
  let cleanedUp = false;
  const cleanup = () => {
    if (!cleanedUp) {
      cleanedUp = true;
      tracker.release();
    }
  };

  // Manual: Register cleanup for abort
  signal.addEventListener("abort", cleanup, { once: true });

  try {
    // Manual: Check if already aborted before doing work
    if (signal.aborted) {
      cleanup();
      return;
    }

    if (depth > 1) {
      // Manual: Thread the signal to child workers
      children.push(worker(depth - 1, tracker, barrier, signal));
    }

    // Signal that this worker has allocated its resource
    await barrier.arrive();

    // Manual: Check if aborted after each await
    if (signal.aborted) {
      cleanup();
      await Promise.allSettled(children);
      return;
    }

    // Simulate indefinite wait - in real code this would be actual async work
    // We use a pattern that responds to abort
    await new Promise<void>((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      signal.addEventListener("abort", () => resolve(), { once: true });
    });

    // Manual: Wait for children to clean up
    await Promise.allSettled(children);
  } finally {
    // Manual: Cleanup - but note this may not run if we don't await properly!
    // The cleanup() call here is redundant with the signal handler,
    // but demonstrates the complexity of getting cleanup right.
    cleanup();

    // Manual: Remove the event listener to avoid memory leaks
    signal.removeEventListener("abort", cleanup);
  }
}
