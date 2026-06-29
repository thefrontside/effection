import { expect } from "@std/expect";
import { run, sleep, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 025: spawned child async finally does not resume when parent returns normally",
  async () => {
    let events: string[] = [];

    let task = run(function* () {
      yield* spawn(function* child() {
        try {
          events.push("child:start");
          yield* suspend();
          events.push("child:after-suspend");
        } finally {
          events.push("child:finally:enter");
          yield* sleep(0);
          events.push("child:finally:exit");
        }
      });
      // let the spawned child reach its suspend before the parent exits
      yield* sleep(0);
      events.push("parent:done");
    });

    await task;

    expect(events).toEqual([
      "child:start",
      "parent:done",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
