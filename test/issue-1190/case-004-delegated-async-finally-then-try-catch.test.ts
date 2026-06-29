import { expect } from "@std/expect";
import { run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 004: halt does not resume into try/catch after delegated async finally",
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
      yield* child();
      try {
        events.push("parent:try");
      } catch (error) {
        events.push(`parent:catch:${(error as Error).message}`);
      }
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
