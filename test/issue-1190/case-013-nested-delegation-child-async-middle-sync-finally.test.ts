import { expect } from "@std/expect";
import { run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 013: halt does not resume parent after nested child async and middle sync finally",
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

    function* middle() {
      try {
        yield* child();
        events.push("middle:after-child");
      } finally {
        events.push("middle:finally");
      }
    }

    let task = run(function* () {
      yield* middle();
      events.push("parent:after-middle");
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "child:finally:exit",
      "middle:finally",
    ]);
  },
);
