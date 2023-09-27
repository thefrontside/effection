import { describe, it, expect } from "./suite.ts";
import { run, spawn, createSignal } from "../mod.ts";

describe("performance", () => {
  it("does degrade beyond an acceptable performance threshold", async() => {
    await run(function* () {
      let perf = globalThis.performance;

      let baselines = [] as number[];

      for (let i = 0; i < 50; i++) {
        let start = perf.now();
        let iteration = { count: 0 };
        for (let i = 0; i < 6000; i++) {
          iteration = Object.create({
            ...iteration,
            count: iteration.count++,
          });
        }

        baselines.push(perf.now() - start);
      }

      let baseline = baselines.reduce((sum, amount) => sum + amount, 0) / baselines.length;


      let signal = createSignal<string>();

      let messages = 0;

      for (let i = 0; i < 1000; i++) {
        yield* spawn(function* () {
          let subscription = yield* signal.stream;
          while (true) {
            yield* subscription.next();
            messages++;
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

      let measure = after - b4;

      let coefficient = measure / baseline;

      //console.dir({  measure, baseline, coefficient });

      expect(coefficient).toBeLessThan(60);

    });
  });
})
