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
 * Error thrown when a barrier times out waiting for arrivals.
 */
export class BarrierTimeoutError extends Error {
  constructor(
    public readonly arrived: number,
    public readonly expected: number,
    public readonly timeoutMs: number,
  ) {
    super(
      `Barrier timed out waiting for ${arrived}/${expected} arrivals after ${timeoutMs}ms`,
    );
    this.name = "BarrierTimeoutError";
  }
}

/**
 * Barrier for synchronizing task startup.
 * Ensures all tasks have started before proceeding, providing deterministic benchmarks.
 *
 * Usage:
 * ```ts
 * const barrier = createBarrier(taskCount, 30000);  // 30s timeout
 *
 * // In each task:
 * await barrier.arrive();  // Blocks until all tasks arrive (or timeout/abort)
 *
 * // Externally (if needed):
 * await barrier.wait();    // Wait for all arrivals without incrementing
 *
 * // On failure (e.g., worker error):
 * barrier.abort(error);    // Reject all pending waiters
 * ```
 */
export interface Barrier {
  /** Signal arrival and wait for all others. Rejects if aborted or timed out. */
  arrive(): Promise<void>;
  /** Wait for all arrivals without incrementing the counter. Rejects if aborted or timed out. */
  wait(): Promise<void>;
  /** Abort the barrier, rejecting all pending waiters with the given error. */
  abort(error: Error): void;
  /** Reset the barrier for reuse */
  reset(): void;
}

/** Default timeout for barrier (30 seconds) */
const DEFAULT_BARRIER_TIMEOUT_MS = 30_000;

/**
 * Creates a barrier that releases when `count` tasks have arrived.
 * @param count Number of arrivals required to release the barrier
 * @param timeoutMs Maximum time to wait for all arrivals (default: 30000ms)
 */
export function createBarrier(
  count: number,
  timeoutMs: number = DEFAULT_BARRIER_TIMEOUT_MS,
): Barrier {
  let arrived = 0;
  let resolvers: Array<{ resolve: () => void; reject: (e: Error) => void }> =
    [];
  let allArrivedResolve: (() => void) | null = null;
  let allArrivedReject: ((e: Error) => void) | null = null;
  let allArrived: Promise<void> | null = null;
  let aborted: Error | null = null;
  let timeoutId: number | null = null;

  function startTimeout() {
    if (timeoutId === null && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        const error = new BarrierTimeoutError(arrived, count, timeoutMs);
        rejectAll(error);
      }, timeoutMs);
    }
  }

  function clearTimeoutIfSet() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function rejectAll(error: Error) {
    aborted = error;
    clearTimeoutIfSet();
    if (allArrivedReject) {
      allArrivedReject(error);
    }
    for (const { reject } of resolvers) {
      reject(error);
    }
    resolvers = [];
  }

  function checkRelease() {
    if (arrived >= count) {
      clearTimeoutIfSet();
      if (allArrivedResolve) {
        allArrivedResolve();
      }
      for (const { resolve } of resolvers) {
        resolve();
      }
      resolvers = [];
    }
  }

  function ensurePromise(): Promise<void> {
    if (!allArrived) {
      allArrived = new Promise((resolve, reject) => {
        allArrivedResolve = resolve;
        allArrivedReject = reject;
      });
      startTimeout();
    }
    return allArrived;
  }

  return {
    arrive(): Promise<void> {
      if (aborted) {
        return Promise.reject(aborted);
      }
      arrived++;
      ensurePromise();
      if (arrived >= count) {
        checkRelease();
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        resolvers.push({ resolve, reject });
      });
    },
    wait(): Promise<void> {
      if (aborted) {
        return Promise.reject(aborted);
      }
      ensurePromise();
      if (arrived >= count) {
        return Promise.resolve();
      }
      return allArrived!;
    },
    abort(error: Error): void {
      if (!aborted) {
        rejectAll(error);
      }
    },
    reset() {
      clearTimeoutIfSet();
      arrived = 0;
      resolvers = [];
      allArrived = null;
      allArrivedResolve = null;
      allArrivedReject = null;
      aborted = null;
    },
  };
}
