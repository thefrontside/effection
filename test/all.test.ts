import {
  asyncReject,
  asyncResolve,
  asyncResource,
  describe,
  expect,
  expectType,
  it,
  syncReject,
  syncResolve,
} from "./suite.ts";

import { all, call, type Operation, run, sleep } from "../mod.ts";

describe("all()", () => {
  it("resolves when the given list is empty", async () => {
    let result = await run(() => all([]));

    expect(result).toEqual([]);
  });

  it("resolves when all of the given operations resolve", async () => {
    let result = await run(() =>
      all([
        syncResolve("quox"),
        asyncResolve(10, "foo"),
        asyncResolve(5, "bar"),
        asyncResolve(15, "baz"),
      ])
    );

    expect(result).toEqual(["quox", "foo", "bar", "baz"]);
  });

  it("rejects when one of the given operations rejects asynchronously first", async () => {
    let result = run(() =>
      all([
        asyncResolve(10, "foo"),
        asyncReject(5, "bar"),
        asyncResolve(15, "baz"),
      ])
    );

    await expect(result).rejects.toHaveProperty("message", "boom: bar");
  });

  it("rejects when one of the given operations rejects asynchronously and another operation does not complete", async () => {
    let result = run(() => all([sleep(0), asyncReject(5, "bar")]));

    await expect(result).rejects.toHaveProperty("message", "boom: bar");
  });

  it("resolves when all of the given operations resolve synchronously", async () => {
    let result = run(() =>
      all([
        syncResolve("foo"),
        syncResolve("bar"),
        syncResolve("baz"),
      ])
    );

    await expect(result).resolves.toEqual(["foo", "bar", "baz"]);
  });

  it("rejects when one of the given operations rejects synchronously first", async () => {
    let result = run(() =>
      all([
        syncResolve("foo"),
        syncReject("bar"),
        syncResolve("baz"),
      ])
    );

    await expect(result).rejects.toHaveProperty("message", "boom: bar");
  });

  it("rejects when one of the operations reject", async () => {
    await run(function* () {
      let fooStatus = { status: "pending" };
      let error;
      try {
        yield* all([
          asyncResource(20, "foo", fooStatus),
          asyncReject(10, "bar"),
        ]);
      } catch (err) {
        error = err;
      }

      expect(fooStatus.status).toEqual("pending");
      expect(error).toHaveProperty("message", "boom: bar");
      yield* sleep(40);
      expect(fooStatus.status).toEqual("pending");
    });
  });

  it("has a type signature equivalent to Promise.all()", () => {
    let resolve = <T>(value: T) => call(() => value);

    expectType<Operation<[string, number, string]>>(
      all([resolve("hello"), resolve(42), resolve("world")]),
    );
    expectType<Operation<[string, number]>>(
      all([resolve("hello"), resolve(42)]),
    );
  });
});
