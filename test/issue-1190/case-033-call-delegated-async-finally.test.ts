import { expect } from "@std/expect";
import { call, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 033: halt does not resume after call() to a child with async finally",
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
      yield* call(child);
      events.push("parent:after-call");
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
