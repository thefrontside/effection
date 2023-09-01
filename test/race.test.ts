import {
  asyncReject,
  asyncResolve,
  describe,
  expect,
  it,
  syncReject,
  syncResolve,
} from "./suite.ts";

import { race, run } from "../mod.ts";

describe("race()", () => {
  it("resolves when one of the given operations resolves asynchronously first", async () => {
    let result = run(() =>
      race([
        asyncResolve(10, "foo"),
        asyncResolve(5, "bar"),
        asyncReject(15, "baz"),
      ])
    );

    await expect(result).resolves.toEqual("bar");
  });

  it("rejects when one of the given operations rejects asynchronously first", async () => {
    let result = run(() =>
      race([
        asyncResolve(10, "foo"),
        asyncReject(5, "bar"),
        asyncReject(15, "baz"),
      ])
    );

    await expect(result).rejects.toHaveProperty("message", "boom: bar");
  });

  it("resolves when one of the given operations resolves synchronously first", async () => {
    let result = run(() =>
      race([
        syncResolve("foo"),
        syncResolve("bar"),
        syncReject("baz"),
      ])
    );

    await expect(result).resolves.toEqual("foo");
  });

  it("rejects when one of the given operations rejects synchronously first", async () => {
    let result = run(() =>
      race([
        syncReject("foo"),
        syncResolve("bar"),
        syncReject("baz"),
      ])
    );

    await expect(result).rejects.toHaveProperty("message", "boom: foo");
  });
});
