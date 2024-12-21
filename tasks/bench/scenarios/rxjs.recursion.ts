import { defer, from, Observable, repeat } from "npm:rxjs";
import { scenario } from "./scenario.ts";
import { action, type Operation } from "../../../mod.ts";

await scenario("rxjs.recursion", run);

function run(depth: number): Operation<void> {
  return action((resolve) => {
    let observable = recurse(depth)
      .subscribe({
        complete() {
          resolve();
        },
      });
    return () => observable.unsubscribe();
  });
}

function recurse(depth: number): Observable<void> {
  return new Observable<void>((subscriber) => {
    if (depth > 1) {
      subscriber.add(
        recurse(depth - 1).subscribe({
          complete() {
            subscriber.complete();
          },
        }),
      );
    } else {
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
