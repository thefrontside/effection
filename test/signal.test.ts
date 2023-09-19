import { describe, expect, it } from "./suite.ts";
import { createSignal, each, run, spawn } from "../mod.ts";

describe("createSignal", () => {
  it("should be able to create many listeners efficiently", async () => {
    let measure = -1;

    await run(function* () {
      let perf = globalThis.performance;

      let signal = createSignal<string>();

      for (let i = 0; i < 500; i++) {
        yield* spawn(function* () {
          for (let _msg of yield* each(signal.stream)) {
            yield* each.next;
          }
        });
      }

      let b4 = perf.now();
      signal.send("hello");
      signal.send("world");
      signal.send("world");
      signal.send("world");
      signal.send("world");
      signal.send("world");
      let after = perf.now();

      measure = after - b4;
      console.log("MEASURE", measure);
    });

    expect(measure).not.toEqual(-1);
    expect(measure).toBeLessThan(500);
  });
});
