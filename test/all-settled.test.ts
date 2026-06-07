import {
  asyncReject,
  asyncResolve,
  describe,
  expect,
  expectType,
  it,
  syncReject,
  syncResolve,
} from "./suite.ts";

import {
  allSettled,
  call,
  type Operation,
  type Result,
  run,
  sleep,
} from "../mod.ts";

describe("allSettled()", () => {
  it("resolves when the given list is empty", async () => {
    let result = await run(() => allSettled([]));

    expect(result).toEqual([]);
  });

  it("resolves when all of the given operations resolve", async () => {
    let result = await run(() =>
      allSettled([
        syncResolve("quox"),
        asyncResolve(10, "foo"),
        asyncResolve(5, "bar"),
        asyncResolve(15, "baz"),
      ])
    );

    expect(result).toEqual([
      { ok: true, value: "quox" },
      { ok: true, value: "foo" },
      { ok: true, value: "bar" },
      { ok: true, value: "baz" },
    ]);
  });

  it("resolves when all of the given operations resolve synchronously", async () => {
    let result = await run(() =>
      allSettled([
        syncResolve("foo"),
        syncResolve("bar"),
        syncResolve("baz"),
      ])
    );

    expect(result).toEqual([
      { ok: true, value: "foo" },
      { ok: true, value: "bar" },
      { ok: true, value: "baz" },
    ]);
  });

  it("returns both successes and failures when operations are mixed", async () => {
    let result = await run(() =>
      allSettled([
        syncResolve("foo"),
        syncReject("bar"),
        asyncResolve(10, "baz"),
        asyncReject(5, "qux"),
      ])
    );

    expect(result[0]).toMatchObject({ ok: true, value: "foo" });
    expect(result[1]).toMatchObject({
      ok: false,
      error: { message: "boom: bar" },
    });
    expect(result[2]).toMatchObject({ ok: true, value: "baz" });
    expect(result[3]).toMatchObject({
      ok: false,
      error: { message: "boom: qux" },
    });
  });

  it("resolves with all errors when all of the given operations reject", async () => {
    let result = await run(() =>
      allSettled([
        syncReject("foo"),
        asyncReject(5, "bar"),
      ])
    );

    expect(result[0]).toMatchObject({
      ok: false,
      error: { message: "boom: foo" },
    });
    expect(result[1]).toMatchObject({
      ok: false,
      error: { message: "boom: bar" },
    });
  });

  it("does not reject when one operation rejects asynchronously first", async () => {
    let result = await run(() =>
      allSettled([
        asyncResolve(10, "foo"),
        asyncReject(5, "bar"),
        asyncResolve(15, "baz"),
      ])
    );

    expect(result.length).toEqual(3);
  });

  it("does not halt sibling operations when one fails", async () => {
    let teardown = false;
    await run(function* () {
      yield* allSettled([
        call(function* () {
          try {
            yield* sleep(20);
            return "foo";
          } finally {
            teardown = true;
          }
        }),
        asyncReject(10, "bar"),
      ]);
    });

    expect(teardown).toEqual(true);
  });

  it("runs teardown for all operations before allSettled completes", async () => {
    let observed = await run(function* () {
      let teardowns: string[] = [];
      let result = yield* allSettled([
        call(function* () {
          try {
            return "foo";
          } finally {
            teardowns.push("success");
          }
        }),
        call(function* () {
          try {
            throw new Error("boom: bar");
          } finally {
            teardowns.push("failure");
          }
        }),
      ]);

      return { result, teardowns: teardowns.sort() };
    });

    expect(observed.teardowns).toEqual(["failure", "success"]);
    expect(observed.result[0]).toMatchObject({ ok: true, value: "foo" });
    expect(observed.result[1]).toMatchObject({
      ok: false,
      error: { message: "boom: bar" },
    });
  });

  it("has a type signature congruent with Promise.allSettled()", () => {
    let resolve = <T>(value: T) => call(() => value);

    expectType<
      Operation<[Result<string>, Result<number>, Result<string>]>
    >(
      allSettled([resolve("hello"), resolve(42), resolve("world")]),
    );
    expectType<Operation<[Result<string>, Result<number>]>>(
      allSettled([resolve("hello"), resolve(42)]),
    );
  });
});
