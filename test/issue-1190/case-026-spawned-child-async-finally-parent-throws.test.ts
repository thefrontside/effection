import { expect } from "@std/expect";
import { run, sleep, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 026: spawned child async finally does not resume when parent throws",
  async () => {
    let events: string[] = [];

    let task = run(function* () {
      yield* spawn(function* child() {
        try {
          events.push("child:start");
          yield* suspend();
          events.push("child:after-suspend");
        } finally {
          events.push("child:finally:enter");
          yield* sleep(0);
          events.push("child:finally:exit");
        }
      });
      // let the spawned child reach its suspend before the parent throws
      yield* sleep(0);
      events.push("parent:throw");
      throw new Error("parent:boom");
    });

    await expect(task).rejects.toHaveProperty("message", "parent:boom");

    expect(events).toEqual([
      "child:start",
      "parent:throw",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
