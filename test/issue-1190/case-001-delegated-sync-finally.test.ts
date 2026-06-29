import { expect } from "@std/expect";
import { run, suspend } from "../../mod.ts";

Deno.test(
  "scenario 001: halt does not resume after delegated synchronous finally",
  async () => {
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally");
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
      "child:finally",
    ]);
  },
);
