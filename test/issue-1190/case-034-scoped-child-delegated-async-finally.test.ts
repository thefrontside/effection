import { expect } from "@std/expect";
import { run, scoped, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 034: halt does not resume after scoped(child) with async finally",
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
      yield* scoped(child);
      events.push("parent:after-scoped");
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
