import { expect } from "@std/expect";
import { run, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 023: halt does not resume after delegated finally halts a spawned task",
  async () => {
    let events: string[] = [];

    function* child() {
      let inner = yield* spawn(function* () {
        try {
          events.push("inner:start");
          yield* suspend();
        } finally {
          events.push("inner:cleanup");
        }
      });
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* inner.halt();
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
      "inner:start",
      "child:finally:enter",
      "inner:cleanup",
      "child:finally:exit",
    ]);
  },
);
