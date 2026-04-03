import { call, each, interval, race, run, sleep, spawn } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("interval", () => {
  it("can be iterated", async () => {
    await run(function* () {
      let task = yield* spawn(function* () {
        let total = 0;
        for (let _ of yield* each(interval(1))) {
          total++;
          if (total == 10) {
            return total;
          }
          yield* each.next();
        }
      });
      let result = yield* race([
        task,
        call(function* () {
          yield* sleep(500);
          return "interval not producing!";
        }),
      ]);
      expect(result).toEqual(10);
    });
  });
});
