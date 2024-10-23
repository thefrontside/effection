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
  call,
  type Operation,
  race,
  run,
  sleep,
  spawn,
  suspend,
} from "../mod.ts";

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

  it("has a type signature equivalent to Promise.race()", () => {
    let resolve = <T>(value: T) => call(() => value);

    expectType<Operation<string | number>>(
      race([resolve("hello"), resolve(42), resolve("world")]),
    );
    expectType<Operation<string | number>>(
      race([resolve("hello"), resolve(42)]),
    );
    expectType<Operation<string | number | boolean>>(
      race([resolve("hello"), resolve(42), resolve("world"), resolve(true)]),
    );
  });

  it.skip("transfers tasks created in a contestant into the parent", async () => {
    type State = { name: string; status: string };

    function* op(name: string, delay: number): Operation<State> {
      let state = { name, status: "pending" };
      yield* spawn(function* () {
        try {
          state.status = `open`;
          yield* suspend();
        } finally {
          state.status = `closed`;
        }
      });
      yield* sleep(delay);
      return state;
    }

    await run(function* () {
      let state = yield* race([op("winner", 0)]);
      expect(state).toEqual({ name: "winner", status: "open" });
    });
  });

  it.skip("doesn't adopt childless scopes", async () => {
  });
});
