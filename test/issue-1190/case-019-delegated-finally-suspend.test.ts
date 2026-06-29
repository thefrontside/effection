import { expect } from "@std/expect";
import { run, suspend } from "../../mod.ts";

Deno.test(
  "scenario 019: delegated finally that suspends does not resume parent and leaves halt pending",
  async () => {
    let events: string[] = [];
    let haltSettled = false;

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* suspend();
        events.push("child:finally:after-suspend");
      }
    }

    let task = run(function* () {
      yield* child();
      events.push("parent:after-child");
    });

    task.halt().then(
      () => {
        haltSettled = true;
      },
      () => {
        haltSettled = true;
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(haltSettled).toBe(false);
    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
    ]);
  },
);
