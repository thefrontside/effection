/**
 * RxJS TakeUntil Cancellation Benchmark
 *
 * Demonstrates RxJS's idiomatic approach to cancellation using takeUntil + finalize.
 * RxJS doesn't have built-in structured concurrency, but provides:
 *
 * 1. takeUntil() operator for signal-based completion
 * 2. finalize() operator for cleanup side effects (runs on complete/error/unsubscribe)
 * 3. Subject as a cancellation signal source
 * 4. merge() for concurrent subscription management
 *
 * Key differences from Effection:
 * - Explicit cancellation signal (Subject + takeUntil)
 * - No automatic scope hierarchy - must wire takeUntil to each observable
 * - Cleanup via finalize() operator
 */

import {
  finalize,
  merge,
  NEVER,
  Observable,
  Subject,
  takeUntil,
} from "npm:rxjs";
import { call } from "../../../../mod.ts";
import { type CancellationParams, cancellationScenario } from "./scenario.ts";
import {
  type Barrier,
  createBarrier,
  type ResourceTracker,
} from "./tracker.ts";

await cancellationScenario(
  "rxjs.cancellation",
  (params) => call(() => runBenchmark(params)),
);

async function runBenchmark(params: CancellationParams): Promise<void> {
  const { tasks, depth, tracker } = params;

  // Calculate total expected allocations
  const totalAllocations = tasks * depth;
  const barrier = createBarrier(totalAllocations);

  // Cancellation signal - when this emits, all workers complete via takeUntil
  const cancel$ = new Subject<void>();

  // Create worker observables - each pipes through takeUntil(cancel$)
  const workers: Observable<void>[] = [];
  for (let i = 0; i < tasks; i++) {
    workers.push(createWorkerTree(depth, tracker, barrier, cancel$));
  }

  // Merge all workers into a single subscription
  // This is idiomatic RxJS for concurrent execution
  await new Promise<void>((resolve) => {
    const subscription = merge(...workers).subscribe({
      complete: () => resolve(),
    });

    // Wait for all workers to allocate, then trigger cancellation
    barrier.wait().then(() => {
      cancel$.next();
      cancel$.complete();
    });

    // Cleanup subscription after cancellation completes
    cancel$.subscribe({
      complete: () => subscription.unsubscribe(),
    });
  });
}

/**
 * Creates a worker observable tree with nested children.
 *
 * Uses idiomatic RxJS pattern:
 * - NEVER as the base (suspends indefinitely)
 * - takeUntil(cancel$) to respond to cancellation
 * - finalize() for cleanup (runs on complete/error/unsubscribe)
 * - merge() for concurrent child workers
 */
function createWorkerTree(
  depth: number,
  tracker: ResourceTracker,
  barrier: Barrier,
  cancel$: Subject<void>,
): Observable<void> {
  return new Observable<void>((subscriber) => {
    // Allocate resource on subscription
    tracker.allocate();

    // Signal that this worker has allocated
    barrier.arrive();

    // Create child worker if depth > 1
    if (depth > 1) {
      const child$ = createWorkerTree(depth - 1, tracker, barrier, cancel$);
      // Subscribe to child and add to teardown
      subscriber.add(child$.subscribe());
    }

    // Never emit, just suspend - takeUntil will complete us
    subscriber.add(
      NEVER.pipe(
        takeUntil(cancel$),
        finalize(() => {
          // Release resource on any termination (complete/error/unsubscribe)
          tracker.release();
        }),
      ).subscribe({
        complete: () => subscriber.complete(),
      }),
    );
  });
}
