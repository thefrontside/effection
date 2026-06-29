import { expect } from "@std/expect";
import { resource, run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 020: halt does not resume after delegated finally yields resource",
  async () => {
    let events: string[] = [];

    function* useCleanupResource() {
      return yield* resource<void>(function* (provide) {
        events.push("resource:setup");
        yield* sleep(0);
        try {
          yield* provide();
        } finally {
          events.push("resource:cleanup");
        }
      });
    }

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* useCleanupResource();
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
      "resource:setup",
      "child:finally:exit",
      "resource:cleanup",
    ]);
  },
);
