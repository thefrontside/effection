import { describe, expect, it } from "./suite.ts";

import { createContext, run, sleep, spawn } from "../mod.ts";

const numbers = createContext("number", 3);

describe("context", () => {
  it("has the initial value available at all times", async () => {
    expect(
      await run(function* () {
        return yield* numbers.get();
      }),
    ).toEqual(3);
  });

  it("can be set within a given scope, but reverts after", async () => {
    let values = await run(function* () {
      let before = yield* numbers.get();

      let within = yield* numbers.with(22, function* () {
        return yield* numbers.get();
      });

      let after = yield* numbers.get();
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
      yield* createContext("missing").expect();
    })).rejects.toHaveProperty("name", "MissingContextError");
  });

  it("inherits values from parent tasks", async () => {
    let context = createContext<string>("just-a-string");
    await run(function* () {
      yield* context.set("hello");

      let task = yield* spawn(function* () {
        return yield* context.get();
      });

      expect(yield* task).toEqual("hello");
    });
  });

  it("does see values that are set by child tasks", async () => {
    let context = createContext<string>("just-a-string");
    await run(function* () {
      yield* context.set("hello");
      yield* spawn(function* () {
        yield* context.set("goodbye");
      });
      yield* sleep(1);
      expect(yield* context.get()).toEqual("hello");
    });
  });
});
