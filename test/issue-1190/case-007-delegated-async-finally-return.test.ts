// deno-lint-ignore-file no-unsafe-finally
import { expect } from "@std/expect";
import { run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 007: halt is not suppressed by return from delegated async finally",
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
        return "child:finally:return";
      }
    }

    let task = run(function* () {
      let value = yield* child();
      events.push(`parent:after-child:${value}`);
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
