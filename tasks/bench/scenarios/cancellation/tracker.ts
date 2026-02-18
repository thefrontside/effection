import type { CorrectnessStats } from "../../types.ts";

/**
 * A simple resource tracker for verifying cleanup correctness in cancellation benchmarks.
 *
 * Usage:
 * ```ts
 * const tracker = createTracker();
 * tracker.allocate();  // Call when resource is acquired
 * try {
 *   // ... use resource
 * } finally {
 *   tracker.release();  // Call in finally to ensure cleanup is tracked
 * }
 * const stats = tracker.stats();  // { allocated, released, leaked }
 * ```
 */
export interface ResourceTracker {
  /** Record a resource allocation */
  allocate(): void;
  /** Record a resource release */
  release(): void;
  /** Add counts in bulk (O(1) instead of O(n) loop) */
  addCounts(allocated: number, released: number): void;
  /** Get current correctness statistics */
  stats(): CorrectnessStats;
  /** Reset all counters to zero */
  reset(): void;
}

/**
 * Creates a new resource tracker instance.
 * Thread-safe for single-threaded JS execution (no atomics needed).
 */
export function createTracker(): ResourceTracker {
  let allocated = 0;
  let released = 0;

  return {
    allocate() {
      allocated++;
    },
    release() {
      released++;
    },
    addCounts(allocCount: number, releaseCount: number) {
      allocated += allocCount;
      released += releaseCount;
    },
    stats(): CorrectnessStats {
      return {
        allocated,
        released,
        leaked: allocated - released,
      };
    },
    reset() {
      allocated = 0;
      released = 0;
    },
  };
}

/**
 * Barrier for synchronizing task startup.
 * Ensures all tasks have started before proceeding, providing deterministic benchmarks.
 *
 * Usage:
 * ```ts
 * const barrier = createBarrier(taskCount);
 *
 * // In each task:
 * await barrier.arrive();  // Blocks until all tasks arrive
 *
 * // Externally (if needed):
 * await barrier.wait();    // Wait for all arrivals without incrementing
 * ```
 */
export interface Barrier {
  /** Signal arrival and wait for all others */
  arrive(): Promise<void>;
  /** Wait for all arrivals without incrementing the counter */
  wait(): Promise<void>;
  /** Reset the barrier for reuse */
  reset(): void;
}

/**
 * Creates a barrier that releases when `count` tasks have arrived.
 */
export function createBarrier(count: number): Barrier {
  let arrived = 0;
  let resolvers: Array<() => void> = [];
  let allArrived: Promise<void> | null = null;
  let resolveAll: (() => void) | null = null;

  function checkRelease() {
    if (arrived >= count && resolveAll) {
      resolveAll();
      for (const resolve of resolvers) {
        resolve();
      }
      resolvers = [];
    }
  }

  return {
    arrive(): Promise<void> {
      arrived++;
      if (!allArrived) {
        allArrived = new Promise((resolve) => {
          resolveAll = resolve;
        });
      }
      if (arrived >= count) {
        checkRelease();
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        resolvers.push(resolve);
      });
    },
    wait(): Promise<void> {
      if (!allArrived) {
        allArrived = new Promise((resolve) => {
          resolveAll = resolve;
        });
      }
      if (arrived >= count) {
        return Promise.resolve();
      }
      return allArrived;
    },
    reset() {
      arrived = 0;
      resolvers = [];
      allArrived = null;
      resolveAll = null;
    },
  };
}
