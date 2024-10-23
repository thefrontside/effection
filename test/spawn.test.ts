// deno-lint-ignore-file no-unsafe-finally
import { describe, expect, it } from "./suite.ts";
import { run, sleep, spawn, suspend } from "../mod.ts";

describe("spawn", () => {
  it("can spawn a new child task", async () => {
    let root = run(function* root() {
      let child = yield* spawn(function* child() {
        let one = yield* Promise.resolve(12);
        let two = yield* Promise.resolve(55);
        return one + two;
      });
      return yield* child;
    });
    await expect(root).resolves.toEqual(67);
  });

  it("halts child when halted", async () => {
    let child;
    let root = run(function* root() {
      child = yield* spawn(function* child() {
        yield* suspend();
      });

      yield* suspend();
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("halts child when finishing normally", async () => {
    let child;
    let result = run(function* parent() {
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
    let root = run(function* root() {
      child = yield* spawn(function* child() {
        try {
          yield* suspend();
        } finally {
          throw new Error("moo");
        }
      });
      yield* sleep(0);
      return "foo";
    });

    await expect(child).rejects.toMatchObject({ message: "moo" });
    await expect(root).rejects.toHaveProperty("message", "moo");
  });

  it("rejects when child errors during halting", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        try {
          yield* suspend();
        } finally {
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
      yield* sleep(0);
    });

    expect(result).toEqual([
      "second start",
      "second done",
      "first start",
      "first done",
    ]);
  });

  it("halts children on explicit halt", async () => {
    let child;
    let root = run(function* () {
      child = yield* spawn(function* () {
        yield* sleep(2);
        return "foo";
      });

      return 1;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty("message", "halted");
  });

  it("raises an uncatchable error if a spawned child fails", async () => {
    let task = run(function* () {
      yield* spawn(function* () {
        yield* sleep(5);
        throw new Error("moo");
      });
      try {
        yield* sleep(10);
      } catch (error) {
        return error;
      }
    });
    await expect(task).rejects.toHaveProperty("message", "moo");
  });
});
