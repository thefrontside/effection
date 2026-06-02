/**
 * Effection events benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/effection.events.ts
 *
 * @module
 */

import { each, on, type Operation, sleep, spawn } from "effection";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures Effection's event handling performance with nested event propagation.
Creates a recursive chain of EventTarget listeners using Effection's \`on()\`
and \`each()\` APIs. Events dispatched at the root propagate through the entire
chain, testing subscription management and structured cleanup.
`.trim();
import type { Scenario } from "./types.ts";

/**
 * Start the events benchmark.
 */
function* start(depth: number): Operation<void> {
  const target = new EventTarget();
  const task = yield* spawn(() => recurse(target, depth));
  for (let i = 0; i < 100; i++) {
    yield* sleep(0);
    target.dispatchEvent(new Event("foo"));
  }
  yield* sleep(0);
  yield* task.halt();
}

/**
 * Recursive event listener chain.
 */
function* recurse(target: EventTarget, depth: number): Operation<void> {
  const eventStream = on(target, "foo");
  if (depth > 1) {
    const subTarget = new EventTarget();
    yield* spawn(() => recurse(subTarget, depth - 1));
    for (const _ of yield* each(eventStream)) {
      subTarget.dispatchEvent(new Event("foo"));
      yield* each.next();
    }
  } else {
    for (const _ of yield* each(eventStream)) {
      yield* each.next();
    }
  }
}

/**
 * Effection events scenario.
 */
export const effectionEvents: Scenario = {
  name: "effection.events",
  library: "effection",
  type: "events",
  run: start,
};
