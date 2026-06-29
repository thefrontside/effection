import { expect } from "@std/expect";
import { run, scoped, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 021: halt does not resume after delegated finally yields scoped",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* scoped(function* () {
          events.push("scoped:enter");
          yield* sleep(0);
          events.push("scoped:exit");
        });
        events.push("child:finally:exit");
      }
    }

    let task = run(function* () {
      yield* child();
      events.push("parent:after-child");
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "scoped:enter",
      "scoped:exit",
      "child:finally:exit",
    ]);
  },
);
