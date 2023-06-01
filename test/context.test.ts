import { describe, expect, it } from "./suite.ts";

import { call, createContext, run } from "../mod.ts";

const numbers = createContext("number", 3);

describe("context", () => {
  it("has the initial value available at all times", async () => {
    expect(
      await run(function* () {
        return yield* numbers;
      }),
    ).toEqual(3);
  });

  it("can be set within a given scope, but reverts after", async () => {
    let values = await run(function* () {
      let before = yield* numbers;
      let within = yield* call(function* () {
        yield* numbers.set(22);
        return yield* numbers;
      });
      let after = yield* numbers;
      return [before, within, after];
    });

    expect(values).toEqual([3, 22, 3]);
  });

  it("is safe to get() when context is not defined", async () => {
    let result = await run(function* () {
      return yield* createContext("missing").get();
    });
    expect(result).toBeUndefined();
  });

  it("is an error to expect() when context is missing", async () => {
    await expect(run(function* () {
      yield* createContext("missing");
    })).rejects.toHaveProperty("name", "MissingContextError");
  });
});
