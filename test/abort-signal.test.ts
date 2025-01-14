import { describe, expect, it } from "./suite.ts";
import { run, useAbortSignal } from "../mod.ts";

describe("useAbortSignal()", () => {
  it("aborts whenever it passes out of scope", async () => {
    let state = { aborted: false };

    let abort = () => state.aborted = true;

    let signal = await run(function* () {
      let signal = yield* useAbortSignal();
      signal.addEventListener("abort", abort);
      expect(signal.aborted).toEqual(false);
      return signal;
    });
    expect(signal.aborted).toBe(true);
    expect(state).toEqual({ aborted: true });
  });
});
