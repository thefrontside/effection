/**
 * Minimal scenario types for the CodSpeed Node benchmark.
 *
 * Trimmed from the effection-benchmarks observatory's harness types: CodSpeed
 * measures CPU instructions, so the memory-sampling machinery is dropped and
 * `markPeak()` is a no-op here.
 *
 * @module
 */

import type { Operation } from "effection";

/**
 * Per-iteration context handed to a scenario. In the observatory this records
 * peak memory; under CodSpeed it is a no-op (CPU instructions are measured).
 */
export interface ScenarioCtx {
  markPeak(): void;
}

/** A benchmark scenario function. */
export type ScenarioFn = (depth: number, ctx: ScenarioCtx) => Operation<void>;

/** A registered scenario with metadata. */
export interface Scenario {
  /** Scenario name (e.g. "effection.recursion"). */
  name: string;
  /** The scenario function. */
  run: ScenarioFn;
  /** Library being benchmarked (e.g. "effection", "rxjs"). */
  library: string;
  /** Scenario type (e.g. "recursion", "events"). */
  type: string;
}
