import {
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
  withResolvers,
} from "../mod.ts";

describe("race()", () => {
  it("resolves when one of the given operations resolves asynchronously first", async () => {
    let first = withResolvers<string>();
    let second = withResolvers<string>();
    let third = withResolvers<string>();
    let result = run(() =>
      race([first.operation, second.operation, third.operation])
    );

    second.resolve("bar");
    first.resolve("foo");
    third.reject(new Error("boom: baz"));

    await expect(result).resolves.toEqual("bar");
  });

  it("rejects when one of the given operations rejects asynchronously first", async () => {
    let first = withResolvers<string>();
    let second = withResolvers<string>();
    let third = withResolvers<string>();
    let result = run(() =>
      race([first.operation, second.operation, third.operation])
    );

    second.reject(new Error("boom: bar"));
    first.resolve("foo");
    third.reject(new Error("boom: baz"));

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

  it("preserves non-Error causes", async () => {
    let cause = { message: "boom" };
    let result = run(() => race([call(() => Promise.reject(cause))]));

    await expect(result).rejects.toBe(cause);
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
