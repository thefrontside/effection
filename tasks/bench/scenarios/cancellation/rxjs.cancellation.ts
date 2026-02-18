/**
 * RxJS TakeUntil Cancellation Benchmark
 *
 * Demonstrates RxJS's approach to cancellation using the takeUntil pattern.
 * RxJS doesn't have built-in structured concurrency, but provides:
 *
 * 1. Subscription management with subscriber.add() for child cleanup
 * 2. takeUntil() operator for signal-based completion
 * 3. finalize() operator for cleanup side effects
 * 4. Subject as a cancellation signal source
 *
 * Key differences from Effection:
 * - Manual subscription management (subscriber.add)
 * - Explicit cancellation signal (Subject + takeUntil)
 * - No automatic scope hierarchy - must wire everything manually
 * - Cleanup via finalize() or subscription teardown
 */

import {
  Observable,
  Subject,
  type Subscriber,
} from "npm:rxjs";
import { call } from "../../../../mod.ts";
import { cancellationScenario, type CancellationParams } from "./scenario.ts";
import { createBarrier, type Barrier, type ResourceTracker } from "./tracker.ts";

await cancellationScenario(
  "rxjs.cancellation",
  (params) => call(() => runBenchmark(params)),
);

async function runBenchmark(params: CancellationParams): Promise<void> {
  const { tasks, depth, tracker } = params;

  // Calculate total expected allocations
  const totalAllocations = tasks * depth;
  const barrier = createBarrier(totalAllocations);

  // Manual: Create a subject to act as the cancellation signal
  const cancel$ = new Subject<void>();

  // Create worker observables
  const workers: Observable<void>[] = [];
  for (let i = 0; i < tasks; i++) {
    workers.push(worker(depth, tracker, barrier, cancel$));
  }

  // Subscribe to all workers
  const subscriptions = workers.map((w) => w.subscribe());

  // Wait for all workers to allocate
  await barrier.wait();

  // Trigger cancellation - this completes all observables using takeUntil
  cancel$.next();
  cancel$.complete();

  // Unsubscribe all (this triggers finalize callbacks)
  subscriptions.forEach((s) => s.unsubscribe());
}

/**
 * Worker observable that allocates a resource and spawns nested children.
 * Uses finalize() for cleanup and subscriber.add() for child management.
 */
function worker(
  depth: number,
  tracker: ResourceTracker,
  barrier: Barrier,
  cancel$: Subject<void>,
): Observable<void> {
  return new Observable<void>((subscriber: Subscriber<void>) => {
    // Allocate resource
    tracker.allocate();

    // Track if we've cleaned up to avoid double-release
    let cleanedUp = false;
    const cleanup = () => {
      if (!cleanedUp) {
        cleanedUp = true;
        tracker.release();
      }
    };

    // Manual: Set up cleanup via finalize or teardown
    subscriber.add(() => cleanup());

    if (depth > 1) {
      // Manual: Create and manage child subscription
      const child = worker(depth - 1, tracker, barrier, cancel$);
      subscriber.add(child.subscribe());
    }

    // Signal that this worker has allocated
    barrier.arrive();

    // Add takeUntil to respond to cancellation
    // But since we're inside Observable constructor, we need to handle this differently
    const cancellation = cancel$.subscribe(() => {
      cleanup();
      subscriber.complete();
    });
    subscriber.add(cancellation);
  });
}
