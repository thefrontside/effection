/**
 * RxJS events benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/rxjs.events.ts
 *
 * @module
 */

import { fromEvent, Observable, Subject, takeUntil, type Subscriber } from "rxjs";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures RxJS event handling with nested Observable chains. Uses \`fromEvent()\`
to create recursive event listeners that propagate events through the chain.
Tests subscription management, Subject-based cancellation via \`takeUntil()\`,
and cleanup when the event stream completes.
`.trim();
import { action, type Operation, sleep, spawn } from "effection";
import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Run the RxJS events benchmark.
 */
function* run(depth: number, ctx: ScenarioCtx): Operation<void> {
  const target = new EventTarget();
  const abort = new Subject<void>();
  const promised = yield* spawn(() =>
    action<void>((resolve) => {
      const observable = recurse(target, depth)
        .pipe(takeUntil(abort))
        .subscribe({
          complete() {
            resolve();
          },
        });
      return () => observable.unsubscribe();
    })
  );
  for (let i = 0; i < 100; i++) {
    yield* sleep(0);
    target.dispatchEvent(new Event("foo"));
  }
  // Peak: full subscription chain is alive and 100 events have propagated;
  // takeUntil(abort) hasn't fired yet.
  ctx.markPeak();
  yield* sleep(0);
  abort.next();
  yield* promised;
}

/**
 * Recursive RxJS event listener chain.
 */
function recurse(target: EventTarget, depth: number): Observable<void> {
  return new Observable<void>((subscriber: Subscriber<void>) => {
    const o = fromEvent(target, "foo");
    if (depth > 1) {
      const subTarget = new EventTarget();
      subscriber.add(
        o.subscribe(() => {
          subTarget.dispatchEvent(new Event("foo"));
        }),
      );
      subscriber.add(recurse(subTarget, depth - 1).subscribe());
    } else {
      subscriber.add(
        o.subscribe(() => {
          // bottom of recursion
        }),
      );
    }
  });
}

/**
 * RxJS events scenario.
 */
export const rxjsEvents: Scenario = {
  name: "rxjs.events",
  library: "rxjs",
  type: "events",
  run,
};
