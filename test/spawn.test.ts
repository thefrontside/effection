import { describe, expect, it } from "./suite.ts";
import {
  action,
  expect as $expect,
  run,
  sleep,
  spawn,
  suspend,
} from "../mod.ts";

describe("spawn", () => {
  it("can spawn a new child task", async () => {
    let root = run(function* () {
      let child = yield* spawn(function* () {
        let one = yield* $expect(Promise.resolve(12));
        let two = yield* $expect(Promise.resolve(55));

        return one + two;
      });

      return yield* child;
    });
    await expect(root).resolves.toEqual(67);
  });

  it("halts child when halted", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        yield* suspend();
      });

      yield* suspend();
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("halts child when finishing normally", async () => {
    let child;
    let result = run(function* () {
      child = yield* spawn(function* () {
        yield* suspend();
      });

      return 1;
    });

    await expect(result).resolves.toEqual(1);
    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("halts child when errored", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        yield* suspend();
      });

      throw new Error("boom");
    });

    await expect(root).rejects.toHaveProperty("message", "boom");
    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("rejects parent when child errors", async () => {
    let child;
    let error = new Error("moo");
    let root = run(function* () {
      child = yield* spawn(function* () {
        yield* sleep(1);
        throw error;
      });

      yield* suspend();
    });

    await expect(root).rejects.toEqual(error);
    await expect(child).rejects.toEqual(error);
  });

  it("finishes normally when child halts", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(() => suspend());
      yield* child.halt();

      return "foo";
    });

    await expect(root).resolves.toEqual("foo");
    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("rejects when child errors during completing", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        try {
          yield* suspend();
        } finally {
          // deno-lint-ignore no-unsafe-finally
          throw new Error("moo");
        }
      });
      return "foo";
    });

    await expect(root).rejects.toHaveProperty("message", "moo");
    await expect(child).rejects.toHaveProperty("message", "moo");
  });

  it("rejects when child errors during halting", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        try {
          yield* suspend();
        } finally {
          // deno-lint-ignore no-unsafe-finally
          throw new Error("moo");
        }
      });
      yield* suspend();
      return "foo";
    });

    await expect(root.halt()).rejects.toHaveProperty("message", "moo");
    await expect(child).rejects.toHaveProperty("message", "moo");
    await expect(root.halt()).rejects.toHaveProperty("message", "moo");
  });

  it("halts when child finishes during asynchronous halt", async () => {
    let didFinish = false;
    let root = run(function* () {
      yield* spawn(function* () {
        yield* sleep(5);
      });
      try {
        yield* suspend();
      } finally {
        yield* sleep(20);
        didFinish = true;
      }
    });

    await root.halt();

    expect(didFinish).toEqual(true);
  });

  it("runs destructors in reverse order and in series", async () => {
    let result: string[] = [];

    await run(function* () {
      yield* spawn(function* () {
        try {
          yield* suspend();
        } finally {
          result.push("first start");
          yield* sleep(5);
          result.push("first done");
        }
      });
      yield* spawn(function* () {
        try {
          yield* suspend();
        } finally {
          result.push("second start");
          yield* sleep(10);
          result.push("second done");
        }
      });
    });

    expect(result).toEqual([
      "second start",
      "second done",
      "first start",
      "first done",
    ]);
  });

  it("can catch an error spawned inside of an action", async () => {
    let error = new Error("boom!");
    let value = await run(function* () {
      try {
        yield* action(function* TheAction() {
          yield* spawn(function* TheBomb() {
            yield* sleep(1);
            throw error;
          });
          yield* sleep(5000);
        });
      } catch (err) {
        return err;
      }
    });
    expect(value).toBe(error);
  });

  it("halts children on explicit halt", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        yield* sleep(20);
        return "foo";
      });

      return 1;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty("message", "halted");
  });
});
