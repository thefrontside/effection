import { callcc } from "../../../../lib/callcc.ts";
import { Err, Ok } from "../../../../lib/result.ts";
import { encapsulate } from "../../../../lib/task-group.ts";
import {
  createChannel,
  each,
  main,
  type Operation,
  spawn,
} from "../../../../mod.ts";
import type {
  BenchmarkStatsByKind,
  BenchmarkWorkerEvent,
  CancellationBenchmarkOptions,
  TimingStats,
  WorkerCommand,
} from "../../types.ts";
import { messages } from "../../worker.ts";
import { createTracker, type ResourceTracker } from "./tracker.ts";

const commands = messages<WorkerCommand>();

const send = (event: BenchmarkWorkerEvent) => self.postMessage(event);

/**
 * Calculate statistical metrics from an array of timing samples.
 */
function calculateStats(
  times: number[],
): Omit<TimingStats, "reps" | "times"> {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const variance = times.reduce((acc, t) => acc + (t - avg) ** 2, 0) /
    times.length;

  return {
    avgTime: avg,
    minTime: sorted[0],
    maxTime: sorted[sorted.length - 1],
    stdDev: Math.sqrt(variance),
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

/**
 * Calculate the p-th percentile from a sorted array.
 */
function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Parameters passed to cancellation benchmark implementations.
 */
export interface CancellationParams {
  /** Number of concurrent tasks to spawn */
  tasks: number;
  /** Nesting depth for sub-tasks */
  depth: number;
  /** Resource tracker for correctness verification */
  tracker: ResourceTracker;
}

/**
 * A cancellation benchmark function.
 * Must spawn `tasks` concurrent workers, each with nested sub-tasks up to `depth`,
 * then cancel them all. Uses `tracker` to record resource allocations and releases.
 */
export type CancellationBenchmark = (
  params: CancellationParams,
) => Operation<void>;

/**
 * Entry point for cancellation benchmark scenarios.
 * Similar to the base `scenario()` but:
 * - Expects CancellationBenchmarkOptions with `tasks` parameter
 * - Tracks resource allocation/release for correctness verification
 * - Reports correctness stats alongside timing stats
 */
export function cancellationScenario(
  name: string,
  perform: CancellationBenchmark,
) {
  return main(function* () {
    try {
      yield* callcc<void>(function* (exit) {
        const work = createChannel<CancellationBenchmarkOptions, never>();

        yield* spawn(function* () {
          for (const command of yield* each(commands)) {
            if (command.type === "close") {
              yield* exit();
            } else if ("kind" in command && command.kind === "cancellation") {
              yield* work.send(command);
            }
            yield* each.next();
          }
        });

        for (const options of yield* each(work)) {
          const tracker = createTracker();

          // Warmup runs: execute but don't time or report
          for (let i = 0; i < options.warmup; i++) {
            tracker.reset();
            yield* encapsulate(() =>
              perform({
                tasks: options.tasks,
                depth: options.depth,
                tracker,
              })
            );
          }

          // Measured runs
          const times: number[] = [];
          tracker.reset(); // Reset for actual measurements

          for (let i = 0; i < options.repeat; i++) {
            // Reset tracker per-run to accumulate across all runs
            // (We'll aggregate stats at the end)
            const runTracker = createTracker();

            const start = performance.now();

            yield* encapsulate(() =>
              perform({
                tasks: options.tasks,
                depth: options.depth,
                tracker: runTracker,
              })
            );

            const time = performance.now() - start;
            send({ type: "repeat", name, time, rep: i + 1 });
            times.push(time);

            // Accumulate correctness stats across runs
            const runStats = runTracker.stats();
            for (let j = 0; j < runStats.allocated; j++) tracker.allocate();
            for (let j = 0; j < runStats.released; j++) tracker.release();
          }

          const timingStats = calculateStats(times);
          const correctnessStats = tracker.stats();

          const result: BenchmarkStatsByKind["cancellation"] = {
            reps: options.repeat,
            times,
            ...timingStats,
            correctness: correctnessStats,
          };

          send({
            type: "done",
            kind: "cancellation",
            name,
            result: Ok(result),
          });

          yield* each.next();
        }
      });
    } catch (error) {
      send({
        type: "done",
        kind: "cancellation",
        name,
        result: Err(error as Error),
      });
    } finally {
      send({ type: "closed", result: Ok() });
    }
  });
}
