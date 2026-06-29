import { expect } from "@std/expect";
import { all, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 029: all() member error does not resume a delegating sibling after its async finally",
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
      yield* all([
        (function* victim() {
          yield* child();
          events.push("victim:after-child");
          return "victim";
        })(),
        (function* failer() {
          yield* sleep(0);
          events.push("failer:throw");
          throw new Error("failer:boom");
        })(),
      ]);
      events.push("parent:after-all");
    });

    await expect(task).rejects.toHaveProperty("message", "failer:boom");

    expect(events).toEqual([
      "child:start",
      "failer:throw",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
