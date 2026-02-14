import { callcc } from "../../../lib/callcc.ts";
import { Err, Ok } from "../../../lib/result.ts";
import { encapsulate } from "../../../lib/task-group.ts";
import {
  createChannel,
  each,
  main,
  type Operation,
  spawn,
} from "../../../mod.ts";
import type {
  BenchmarkOptions,
  BenchmarkStats,
  BenchmarkWorkerEvent,
  WorkerCommand,
} from "../types.ts";
import { messages } from "../worker.ts";

const commands = messages<WorkerCommand>();

const send = (event: BenchmarkWorkerEvent) => self.postMessage(event);

/**
 * Calculate statistical metrics from an array of timing samples.
 */
function calculateStats(
  times: number[],
): Omit<BenchmarkStats, "reps" | "times"> {
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

export function scenario(
  name: string,
  perform: (depth: number) => Operation<void>,
) {
  return main(function* () {
    try {
      yield* callcc<void>(function* (exit) {
        let work = createChannel<BenchmarkOptions, never>();
        yield* spawn(function* () {
          for (let command of yield* each(commands)) {
            if (command.type === "close") {
              yield* exit();
            } else {
              yield* work.send(command);
            }
            yield* each.next();
          }
        });

        for (let options of yield* each(work)) {
          // Warmup runs: execute but don't time or report
          for (let i = 0; i < options.warmup; i++) {
            yield* encapsulate(() => perform(options.depth));
          }

          // Measured runs
          let times: number[] = [];
          for (let i = 0; i < options.repeat; i++) {
            let start = performance.now();

            yield* encapsulate(() => perform(options.depth));

            let time = performance.now() - start;
            send({ type: "repeat", name, time, rep: i + 1 });
            times.push(time);
          }

          const stats = calculateStats(times);
          const result = Ok({
            reps: options.repeat,
            times,
            ...stats,
          });

          send({ type: "done", name, result });

          yield* each.next();
        }
      });
    } catch (error) {
      send({ type: "done", name, result: Err(error as Error) });
    } finally {
      send({ type: "closed", result: Ok() });
    }
  });
}
