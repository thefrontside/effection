import { describe, expect, it } from "./suite.ts";

import { call, run, spawn, suspend } from "../mod.ts";

describe("call", () => {
  it("invokes an operation", async () => {
    await run(function* () {
      let result = yield* call(function* () {
        return 10;
      });
      expect(result).toEqual(10);
    });
  });

  it("can be used as an error boundary", async () => {
    let error = new Error("boom!");
    let result = await run(function* () {
      try {
        yield* call(function* () {
          yield* spawn(function* () {
            throw error;
          });
          yield* suspend();
        });
      } catch (error) {
        return error;
      }
    });
    expect(result).toEqual(error);
  });
});
