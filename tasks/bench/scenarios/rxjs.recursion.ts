import { Observable, defer, from, repeat } from "npm:rxjs";
import { type Operation, action } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("rxjs.recursion", run);

function run(depth: number, _exit: (time: number) => void): Operation<void> {
  return action((resolve) => {
    let observable = recurse(depth).subscribe({
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
