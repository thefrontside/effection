import { fromEvent, Observable, Subject, takeUntil } from "npm:rxjs";
import { scenario } from "./scenario.ts";
import { action, type Operation, sleep, spawn } from "../../../mod.ts";

await scenario("rxjs.events", run);

function* run(depth: number): Operation<void> {
  const target = new EventTarget();
  const abort = new Subject<void>();
  const promised = yield* spawn(() =>
    action<void>((resolve) => {
      let observable = recurse(target, depth)
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
  yield* sleep(0);
  abort.next();
  yield* promised;
}

function recurse(target: EventTarget, depth: number): Observable<void> {
  return new Observable<void>((subscriber) => {
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
          //                    probeMemory("bottom");
        }),
      );
    }
  });
}
