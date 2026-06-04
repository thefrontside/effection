/**
 * CodSpeed benchmark entry (Node).
 *
 * Runs every scenario under tinybench + @codspeed/tinybench-plugin. In CI the
 * CodSpeedHQ action wraps this with instrumentation and compares the PR's run
 * against the base branch's run of the same repo — so the `effection.*`
 * scenarios surface real per-PR regressions in the built npm package. The
 * comparison-library scenarios are pinned baselines, recorded for historic
 * cross-library context in CodSpeed.
 *
 * Run: node --experimental-strip-types bench/codspeed.bench.ts
 *
 * @module
 */

import { Bench } from "tinybench";
import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { run } from "effection";

import type { Scenario } from "./scenarios/types.ts";
import { effectionRecursion } from "./scenarios/effection.recursion.ts";
import { effectionEvents } from "./scenarios/effection.events.ts";
import { effectionInlineRecursion } from "./scenarios/effection-inline.recursion.ts";
import { asyncAwaitRecursion } from "./scenarios/async-await.recursion.ts";
import { rxjsRecursion } from "./scenarios/rxjs.recursion.ts";
import { rxjsEvents } from "./scenarios/rxjs.events.ts";
import { coRecursion } from "./scenarios/co.recursion.ts";
import { effectRecursion } from "./scenarios/effect.recursion.ts";
import { effectEvents } from "./scenarios/effect.events.ts";
import { effectV4Recursion } from "./scenarios/effect-v4.recursion.ts";
import { effectV4Events } from "./scenarios/effect-v4.events.ts";
import { addEventListenerEvents } from "./scenarios/add-event-listener.events.ts";

const scenarios: Scenario[] = [
  effectionRecursion,
  effectionEvents,
  effectionInlineRecursion,
];

// Depth must be identical across runs (CodSpeed keys a benchmark by name).
// Recursion scenarios instrument cheaply at depth 100. The events scenarios
// cascade 100 events through the whole chain (~events × depth dispatches),
// which explodes under CodSpeed's CPU simulation — effect.events at depth 100
// doesn't finish — so they run at a much smaller depth. Still ~1,000 dispatches
// at depth 10, plenty to surface an instruction-count regression.
const RECURSION_DEPTH = 100;
const EVENTS_DEPTH = 10;
const depthFor = (scenario: Scenario) =>
  scenario.type === "events" ? EVENTS_DEPTH : RECURSION_DEPTH;

const bench = withCodSpeed(new Bench());

for (const scenario of scenarios) {
  bench.add(scenario.name, async () => {
    await run(() => scenario.run(depthFor(scenario)));
  });
}

await bench.run();
console.table(bench.table());
