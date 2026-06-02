/**
 * CodSpeed benchmark entry (Node).
 *
 * Runs every registered scenario under tinybench + @codspeed/tinybench-plugin.
 * In CI the CodSpeedHQ action wraps this with instrumentation and compares the
 * PR's run against the base branch's run of the same repo — so the
 * `effection.*` scenarios surface real per-PR regressions in the built npm
 * package. The comparison-library scenarios are pinned baselines, recorded for
 * historic cross-library context in CodSpeed.
 *
 * Run: node --experimental-strip-types bench-node/codspeed.bench.ts
 *
 * @module
 */

import { Bench } from "tinybench";
import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { run } from "effection";
import { scenarios } from "./scenarios/mod.ts";

// Fixed depth: CodSpeed tracks a benchmark by its stable name, so the workload
// must be identical across runs. Matches the upstream default.
const DEPTH = 100;

// CodSpeed measures CPU instructions, not memory, so peak-marking is a no-op.
const noopCtx = { markPeak() {} };

const bench = withCodSpeed(new Bench());

for (const [name, scenario] of Object.entries(scenarios)) {
  bench.add(name, async () => {
    await run(() => scenario.run(DEPTH, noopCtx));
  });
}

await bench.run();
console.table(bench.table());
