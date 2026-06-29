import { expect } from "@std/expect";
import { race, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 028: race loser does not resume after its delegated async finally",
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
      let result = yield* race([
        (function* loser() {
          yield* child();
          events.push("loser:after-child");
          return "loser";
        })(),
        (function* winner() {
          yield* sleep(0);
          events.push("winner:done");
          return "winner";
        })(),
      ]);
      events.push(`parent:result:${result}`);
    });

    await task;

    expect(events).toEqual([
      "child:start",
      "winner:done",
      "child:finally:enter",
      "child:finally:exit",
      "parent:result:winner",
    ]);
  },
);
