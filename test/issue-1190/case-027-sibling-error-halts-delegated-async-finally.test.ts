import { expect } from "@std/expect";
import { run, sleep, spawn, suspend } from "../../mod.ts";

Deno.test(
  "scenario 027: sibling error does not resume a delegating task after its async finally",
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
      yield* spawn(function* victim() {
        yield* child();
        events.push("victim:after-child");
      });
      yield* spawn(function* sibling() {
        yield* sleep(0);
        events.push("sibling:throw");
        throw new Error("sibling:boom");
      });
      yield* suspend();
    });

    await expect(task).rejects.toHaveProperty("message", "sibling:boom");

    expect(events).toEqual([
      "child:start",
      "sibling:throw",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
