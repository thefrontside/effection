/**
 * RxJS recursion benchmark scenario.
 *
 * Ported from upstream:
 * https://github.com/thefrontside/effection/blob/v4/tasks/bench/scenarios/rxjs.recursion.ts
 *
 * @module
 */

import { defer, from, Observable, repeat, type Subscriber } from "rxjs";

/**
 * Description of this benchmark scenario for the dashboard.
 */
export const description = `
Measures RxJS Observable overhead for deeply nested subscriptions. Creates a
recursive chain of Observables that bottoms out with 100 deferred Promise
emissions, testing subscription lifecycle management and operator chaining
efficiency.
`.trim();
import { action, type Operation } from "effection";
import type { Scenario, ScenarioCtx } from "./types.ts";

/**
 * Wrapper that runs RxJS observable as an Effection operation.
 */
function* run(depth: number, ctx: ScenarioCtx): Operation<void> {
  yield* action<void>((resolve) => {
    const observable = recurse(depth, ctx).subscribe({
      complete() {
        resolve();
      },
    });
    return () => observable.unsubscribe();
  });
}

/**
 * Recursive RxJS observable. `ctx` is captured by closure and used to mark
 * peak memory inside the deepest subscriber (when the full chain is alive).
 */
function recurse(depth: number, ctx: ScenarioCtx): Observable<void> {
  return new Observable<void>((subscriber: Subscriber<void>) => {
    if (depth > 1) {
      subscriber.add(
        recurse(depth - 1, ctx).subscribe({
          complete() {
            subscriber.complete();
          },
        }),
      );
    } else {
      // Peak: the entire subscriber chain is established when we hit the leaf.
      ctx.markPeak();
      subscriber.add(
        defer(() => from(Promise.resolve()))
          .pipe(repeat(100))
          .subscribe({
            complete() {
              subscriber.complete();
            },
          }),
      );
    }
  });
}

/**
 * RxJS recursion scenario.
 */
export const rxjsRecursion: Scenario = {
  name: "rxjs.recursion",
  library: "rxjs",
  type: "recursion",
  run,
};
