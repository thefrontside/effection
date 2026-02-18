import type { Result } from "../../lib/result.ts";

/**
 * Statistical metrics for benchmark results.
 * All time values are in milliseconds.
 */
export interface BenchmarkStats {
  readonly reps: number;
  readonly times: readonly number[];
  readonly avgTime: number;
  readonly minTime: number;
  readonly maxTime: number;
  readonly stdDev: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
}

export interface BenchmarkOptions {
  readonly type: "benchmark";
  readonly repeat: number;
  readonly depth: number;
  readonly warmup: number;
}

export interface CloseCommand {
  readonly type: "close";
}

export interface ClosedEvent {
  readonly type: "closed";
  readonly result: Result<void>;
}

export type WorkerCommand = BenchmarkOptions | CloseCommand;

export type BenchmarkWorkerEvent =
  | BenchmarkRepeatEvent
  | BenchmarkDoneEvent
  | ClosedEvent;

export interface BenchmarkRepeatEvent {
  readonly type: "repeat";
  readonly name: string;
  readonly rep: number;
  readonly time: number;
}

export interface BenchmarkDoneEvent {
  readonly type: "done";
  readonly name: string;
  readonly result: Result<BenchmarkStats>;
}

// JSON output types

export interface BenchmarkJsonOutput {
  readonly metadata: BenchmarkMetadata;
  readonly results: BenchmarkResultGroups;
}

export interface BenchmarkMetadata {
  readonly date: string; // ISO 8601
  readonly deno: string;
  readonly repeat: number;
  readonly warmup: number;
  readonly depth: number;
}

export interface BenchmarkResultGroups {
  readonly recursion: readonly BenchmarkResultEntry[];
  readonly events: readonly BenchmarkResultEntry[];
}

export interface BenchmarkResultEntry {
  readonly name: string;
  readonly stats: BenchmarkStats;
}
