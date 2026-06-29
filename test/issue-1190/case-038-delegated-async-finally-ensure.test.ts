import { expect } from "@std/expect";
import { ensure, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 038: halt does not resume after delegated finally registers async ensure cleanup",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* ensure(function* () {
          events.push("ensure:cleanup:enter");
          yield* sleep(0);
          events.push("ensure:cleanup:exit");
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
      "ensure:cleanup:enter",
      "ensure:cleanup:exit",
    ]);
  },
);
