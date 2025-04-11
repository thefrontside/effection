import { describe, expect, it } from "./suite.ts";

import { run, until } from "../mod.ts";

describe("until", () => {
  it("resolves on success", async () => {
    expect.assertions(1);
    await run(function* () {
      expect(yield* until(Promise.resolve(42))).toEqual(42);
    });
  });
  it("throws on error", async () => {
    expect.assertions(1);
    await run(function* () {
      try {
        yield* until(Promise.reject("error"));
      } catch (error) {
        expect(error).toBe("error");
      }
    });
  });
});
