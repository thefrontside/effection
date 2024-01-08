import { createSignal, each, lift, run, sleep, spawn } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("lift", () => {
  it("safely does not continue if the call stops the operation", async () => {
    let reached = false;

    await run(function* () {
      let signal = createSignal<void, void>();

      yield* spawn(function* () {
        yield* sleep(0);
        yield* lift(signal.close)();

        reached = true;
      });

      for (let _ of yield* each(signal));
    });

    expect(reached).toBe(false);
  });
});
