// deno-lint-ignore-file no-unsafe-finally
import { expect } from "@std/expect";
import { run, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 008: cleanup error propagates without resuming after delegated async finally",
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
        throw new Error("child:finally:error");
      }
    }

    let task = run(function* () {
      yield* child();
      events.push("parent:after-child");
    });

    await expect(task.halt()).rejects.toHaveProperty(
      "message",
      "child:finally:error",
    );
    await expect(task).rejects.toHaveProperty("message", "child:finally:error");

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
