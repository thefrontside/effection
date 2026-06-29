import { expect } from "@std/expect";
import { run, scoped, sleep, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 030: scoped teardown does not resume a delegating child after its async finally",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* sleep(0);
        events.push("child:finally:exit");
      }
    }

    let task = run(function* () {
      yield* scoped(function* () {
        yield* spawn(function* victim() {
          yield* child();
          events.push("victim:after-child");
        });
        // let the spawned child reach its suspend before scoped exits
        yield* sleep(0);
        events.push("scoped:done");
      });
      events.push("parent:after-scoped");
    });

    await task;

    expect(events).toEqual([
      "child:start",
      "scoped:done",
      "child:finally:enter",
      "child:finally:exit",
      "parent:after-scoped",
    ]);
  },
);
