import { expect } from "@std/expect";
import { createScope, sleep, suspend } from "../../mod.ts";

Deno.test(
  "scenario 031: scope destroy does not resume a delegating task after its async finally",
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

    let [scope, destroy] = createScope();

    scope.run(function* () {
      yield* child();
      events.push("task:after-child");
    });

    // let the task reach its suspend before the scope is destroyed
    await new Promise((resolve) => setTimeout(resolve, 0));

    await destroy();

    expect(events).toEqual([
      "child:start",
      "child:finally:enter",
      "child:finally:exit",
    ]);
  },
);
