import { describe, expect, it } from "./suite.ts";

import { call, run, spawn, suspend } from "../mod.ts";

describe("call", () => {
  it("evaluates an operation function", async () => {
    await run(function* () {
      let result = yield* call(function* () {
        return 10;
      });
      expect(result).toEqual(10);
    });
  });

  it("evaluates an operation directly", async () => {
    await expect(run(() =>
      call({
        *[Symbol.iterator]() {
          return 42;
        },
      })
    )).resolves.toEqual(42);
  });

  it("evaluates a no-arg async function", async () => {
    await expect(run(() => call(() => Promise.resolve(42)))).resolves.toEqual(
      42,
    );
  });

  it("evaluates a promise directly", async () => {
    await expect(run(() => call(Promise.resolve(42)))).resolves.toEqual(42);
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
