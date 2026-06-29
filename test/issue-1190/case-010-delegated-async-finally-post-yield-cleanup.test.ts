import { expect } from "@std/expect";
import { run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 010: halt completes post-yield cleanup without resuming after delegated async finally",
  async () => {
    let cleanup = { closed: false };
    let events: string[] = [];

    function* child() {
      try {
        events.push("child:start");
        yield* suspend();
        events.push("child:after-suspend");
      } finally {
        events.push("child:finally:enter");
        yield* sleep(0);
        cleanup.closed = true;
        events.push(`child:finally:closed:${cleanup.closed}`);
      }
    }

    let task = run(function* () {
      yield* child();
      events.push(`parent:after-child:${cleanup.closed}`);
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "child:finally:closed:true",
    ]);
  },
);
