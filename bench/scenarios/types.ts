/**
 * Minimal scenario types for the CodSpeed Node benchmark.
 *
 * Trimmed from the effection-benchmarks observatory: CodSpeed measures CPU
 * instructions, so the memory-sampling machinery (and its `markPeak` hook) is
 * dropped — scenarios are just `(depth) => Operation<void>`.
 *
 * @module
 */

import type { Operation } from "effection";

/** A benchmark scenario function. */
export type ScenarioFn = (depth: number) => Operation<void>;

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
