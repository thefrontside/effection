import { expect } from "@std/expect";
import { all, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 039: external halt does not resume after all([child]) with async finally",
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
      yield* all([child()]);
      events.push("parent:after-all");
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
