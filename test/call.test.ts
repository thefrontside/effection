import { describe, expect, it } from "./suite.ts";

import { call, run, spawn, suspend } from "../mod.ts";

describe("call", () => {
  it("evaluates an operation function", async () => {
    await run(function* () {
      function* fn() {
        return 10;
      }
      let result = yield* call(fn);
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

  it("evaluates an async function", async () => {
    await expect(run(() =>
      call(async function () {
        await Promise.resolve();
        return 42;
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

  it("evaluates a vanilla function", async () => {
    await expect(run(() => call(() => 42))).resolves.toEqual(42);
  });

  it("evaluates a vanilla function that returns an iterable string", async () => {
    await expect(run(() => call(() => "123"))).resolves.toEqual("123");
  });

  it("evaluates a vanilla function that returns an iterable array", async () => {
    await expect(run(() => call(() => [1, 2, 3]))).resolves.toEqual([1, 2, 3]);
  });

  it("evaluates a vanilla function that returns an iterable map", async () => {
    let map = new Map();
    map.set("1", 1);
    map.set("2", 2);
    map.set("3", 3);
    await expect(run(() => call(() => map))).resolves.toEqual(map);
  });

  it("evaluates a vanilla function that returns an iterable set", async () => {
    let arr = new Set([1, 2, 3]);
    await expect(run(() => call(() => arr))).resolves.toEqual(arr);
  });

  it("evaluates a vanilla function that returns an iterator", async () => {
    function* eq() {
      return "value";
    }
    await expect(run(function* () {
      return yield* call(() => eq);
    })).resolves.toEqual(eq);
  });
});
