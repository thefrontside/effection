import { expect } from "@std/expect";
import { ensure, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 038b: halt does not resume after delegated child cleans up via ensure (no try/finally)",
  async () => {
    let events: string[] = [];

    function* child() {
      events.push("child:start");
      yield* ensure(function* () {
        events.push("ensure:cleanup:enter");
        yield* sleep(0);
        events.push("ensure:cleanup:exit");
      });
      yield* suspend();
      events.push("child:after-suspend");
    }

    let task = run(function* () {
      yield* child();
      events.push("parent:after-child");
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(events).toEqual([
      "child:start",
      "ensure:cleanup:enter",
      "ensure:cleanup:exit",
    ]);
  },
);
