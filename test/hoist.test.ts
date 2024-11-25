import { constant } from "../lib/constant.ts";
import { hoist } from "../lib/hoist.ts";
import { call, Operation, run, suspend } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("hoist", () => {
  it("can be used for simple operations", async () => {
    let value = await run(function* () {
      return yield hoist(call(() => Promise.resolve(10)));
    });
    expect(value).toEqual(10);
  });

  it("can be used for operations with multiple yield points", async () => {
    let result = await run(function* () {
      let first = yield hoist(function* () {
        return yield hoist(constant(5));
      }());
      let second = yield hoist(function* () {
        return yield hoist(constant(5));
      }());
      return (first as number) + (second as number);
    });
    expect(result).toEqual(10);
  });
  it("can be used for recursive operations", async () => {
    function* recurse(depth: number, total: number): Operation<number> {
      if (depth > 0) {
        return (yield hoist(recurse(depth - 1, total + depth))) as number;
      } else {
        for (let i = 0; i < 10; i++) {
          total += yield* call(() => Promise.resolve(1));
        }
        return total;
      }
    }
    await expect(run(() => recurse(10, 0))).resolves.toEqual(65);
  });
  it("successfully halts hoisted iterators", async () => {
    let backout = 0;

    function* recurse(depth: number, total: number): Operation<number> {
      if (depth > 0) {
        try {
          return (yield hoist(recurse(depth - 1, total + depth))) as number;
        } finally {
          backout += (yield hoist(call(() => Promise.resolve(1)))) as number;
        }
      } else {
        yield* suspend();
        return 10;
      }
    }

    let task = run(() => recurse(10, 0));

    await task.halt();

    expect(backout).toEqual(10);
  });

  it.skip("handles unwinding when hoisted iterators throw", async () => {
    interface CountingError extends Error {
      cause: number;
    }

    function* recurse(depth: number): Operation<number> {
      if (depth > 0) {
        try {
          return (yield hoist(recurse(depth - 1))) as number;
        } catch (err) {
          let counter = err as CountingError;
          counter.cause += (yield hoist(call(() =>
            Promise.resolve(1)
          ))) as number;
          throw counter;
        }
      } else {
        throw new Error("bottom", { cause: 0 });
      }
    }

    try {
      await run(() => recurse(10));
      throw new Error(`expected to throw, but did not`);
    } catch (err) {
      expect((err as CountingError).cause).toEqual(10);
    }
  });
});
