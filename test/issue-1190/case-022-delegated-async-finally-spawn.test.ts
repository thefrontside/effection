import { expect } from "@std/expect";
import { run, sleep, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 022: halt does not resume after delegated finally spawns and awaits a task",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        let task = yield* spawn(function* () {
          events.push("spawned:enter");
          yield* sleep(0);
          events.push("spawned:exit");
        });
        yield* task;
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
      "spawned:enter",
      "spawned:exit",
      "child:finally:exit",
    ]);
  },
);
