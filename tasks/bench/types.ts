import type { Result } from "../../lib/result.ts";

// =============================================================================
// Benchmark Categories
// =============================================================================

export type BenchmarkKind = "recursion" | "events" | "cancellation";

// =============================================================================
// Timing Stats (shared base for all benchmarks)
// =============================================================================

/**
 * Statistical metrics for benchmark timing results.
 * All time values are in milliseconds.
 */
export interface TimingStats {
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

// =============================================================================
// Correctness Stats (for cancellation benchmarks)
// =============================================================================

/**
 * Resource tracking stats for verifying cleanup correctness.
 */
export interface CorrectnessStats {
  readonly allocated: number;
  readonly released: number;
  readonly leaked: number; // allocated - released
}

// =============================================================================
// Kind-to-Stats Mapping
// =============================================================================

export type BenchmarkStatsByKind = {
  recursion: TimingStats;
  events: TimingStats;
  cancellation: TimingStats & { readonly correctness: CorrectnessStats };
};

/**
 * @deprecated Use TimingStats or BenchmarkStatsByKind[K] instead
 */
export type BenchmarkStats = TimingStats;

// =============================================================================
// Benchmark Options
// =============================================================================

interface BaseBenchmarkOptions {
  readonly type: "benchmark";
  readonly repeat: number;
  readonly warmup: number;
}

export interface RecursionBenchmarkOptions extends BaseBenchmarkOptions {
  readonly kind: "recursion";
  readonly depth: number;
}

export interface EventsBenchmarkOptions extends BaseBenchmarkOptions {
  readonly kind: "events";
  readonly depth: number;
}

export interface CancellationBenchmarkOptions extends BaseBenchmarkOptions {
  readonly kind: "cancellation";
  readonly depth: number;
  readonly tasks: number;
}

export type BenchmarkOptions =
  | RecursionBenchmarkOptions
  | EventsBenchmarkOptions
  | CancellationBenchmarkOptions;

/**
 * Legacy options format (for backward compatibility with existing scenarios)
 * @deprecated Use BenchmarkOptions with explicit kind instead
 */
export interface LegacyBenchmarkOptions {
  readonly type: "benchmark";
  readonly repeat: number;
  readonly depth: number;
  readonly warmup: number;
}

// =============================================================================
// Worker Commands
// =============================================================================

export interface CloseCommand {
  readonly type: "close";
}

export interface ClosedEvent {
  readonly type: "closed";
  readonly result: Result<void>;
}

export type WorkerCommand =
  | BenchmarkOptions
  | LegacyBenchmarkOptions
  | CloseCommand;

// =============================================================================
// Worker Events
// =============================================================================

export interface BenchmarkRepeatEvent {
  readonly type: "repeat";
  readonly name: string;
  readonly rep: number;
  readonly time: number;
}

export interface BenchmarkDoneEvent<K extends BenchmarkKind = BenchmarkKind> {
  readonly type: "done";
  readonly kind?: K; // Optional for backward compat with existing scenarios
  readonly name: string;
  readonly result: Result<BenchmarkStatsByKind[K]>;
}

export type BenchmarkWorkerEvent =
  | BenchmarkRepeatEvent
  | BenchmarkDoneEvent
  | ClosedEvent;

// =============================================================================
// JSON Output Types
// =============================================================================

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
  readonly tasks?: number; // For cancellation benchmarks
}

export interface BenchmarkResultGroups {
  readonly recursion: readonly BenchmarkResultEntry[];
  readonly events: readonly BenchmarkResultEntry[];
  readonly cancellation?: readonly CancellationResultEntry[];
}

export interface BenchmarkResultEntry {
  readonly name: string;
  readonly stats: TimingStats;
}

export interface CancellationResultEntry {
  readonly name: string;
  readonly stats: TimingStats & { readonly correctness: CorrectnessStats };
}
