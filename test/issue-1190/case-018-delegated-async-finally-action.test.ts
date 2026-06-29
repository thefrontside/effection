import { expect } from "@std/expect";
import { action, run, suspend } from "../../mod.ts";

Deno.test(
  "scenario 018: halt does not resume after delegated finally yields action",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* action<void>((resolve) => {
          queueMicrotask(resolve);
          return () => {};
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
      "child:finally:exit",
    ]);
  },
);
