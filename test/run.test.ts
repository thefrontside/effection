// deno-lint-ignore-file no-unsafe-finally
import assert from "node:assert";
import { Children } from "../lib/contexts.ts";
import {
  action,
  createScope,
  run,
  type Scope,
  sleep,
  spawn,
  suspend,
  type Task,
  until,
  useScope,
} from "../mod.ts";
import { blowUp, createNumber, describe, expect, it } from "./suite.ts";

describe("run()", () => {
  it("can run an operation", async () => {
    await expect(run(function* () {
      return "hello";
    })).resolves.toEqual("hello");
  });

  it("can compose multiple promises via generator", async () => {
    let result = await run(function* () {
      let one = yield* until(Promise.resolve(12));
      let two = yield* until(Promise.resolve(55));
      return one + two;
    });
    expect(result).toEqual(67);
  });

  it("can compose operations", async () => {
    let result = await run(function* () {
      let one = yield* createNumber(12);
      let two = yield* createNumber(55);
      return one + two;
    });
    expect(result).toEqual(67);
  });

  it("rejects generator if subtask promise fails", async () => {
    let error = new Error("boom");
    let task = run(function* () {
      let one = yield* createNumber(12);
      let two = yield* blowUp<number>();
      return one + two;
    });

    await expect(task).rejects.toEqual(error);
  });

  it("rejects generator if generator creation fails", async () => {
    let task = run(function () {
      throw new Error("boom");
    });

    await expect(task).rejects.toMatchObject({ message: "boom" });
  });

  it("can recover from errors in promise", async () => {
    let error = new Error("boom");
    let task = run(function* () {
      let one = yield* until(Promise.resolve(12));
      let two;
      try {
        yield* until(Promise.reject(error));
        two = 9;
      } catch (_) {
        // swallow error and yield in catch block
        two = yield* until(Promise.resolve(8));
      }
      let three = yield* until(Promise.resolve(55));
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
  });

  it("can recover from errors in operation", async () => {
    let task = run(function* () {
      let one = yield* until(Promise.resolve(12));
      let two;
      try {
        yield* blowUp();
        two = 9;
      } catch (_e) {
        // swallow error and yield in catch block
        two = yield* until(Promise.resolve(8));
      }
      let three = yield* until(Promise.resolve(55));
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
  });

  it("can halt generator", async () => {
    let halted = false;
    let task = run(function* () {
      try {
        yield* suspend();
      } finally {
        halted = true;
      }
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");
    expect(halted).toEqual(true);
  });

  it("can halt a task as an operation", async () => {
    let halted = false;
    let task = run(function* () {
      try {
        yield* suspend();
      } finally {
        halted = true;
      }
    });

    await run(task.halt);
    await expect(task).rejects.toHaveProperty("message", "halted");
    expect(halted).toEqual(true);
  });

  it("halts task when halted generator", async () => {
    let parent = "running";
    let child = "running";
    let task = run(function* () {
      try {
        yield* (function* () {
          try {
            yield* suspend();
          } finally {
            child = "halted";
          }
        })();
      } finally {
        parent = "halted";
      }
    });

    await task.halt();

    await expect(task).rejects.toHaveProperty("message", "halted");
    expect(child).toEqual("halted");
    expect(parent).toEqual("halted");
  });

  it("can perform async operations in a finally block", async () => {
    let completed = false;

    let task = run(function* () {
      try {
        yield* suspend();
      } finally {
        yield* sleep(1);
        completed = true;
      }
    });

    await task.halt();
    await expect(task).rejects.toMatchObject({ message: "halted" });

    expect(completed).toEqual(true);
  });

  it("can suspend in yielded finally block", async () => {
    let things: string[] = [];

    let task = run(function* () {
      try {
        yield* (function* () {
          try {
            yield* suspend();
          } finally {
            yield* sleep(5);
            things.push("first");
          }
        })();
      } finally {
        things.push("second");
      }
    });

    await task.halt();
    await expect(task).rejects.toHaveProperty("message", "halted");

    expect(things).toEqual(["first", "second"]);
  });

  it("can be halted while in the generator", async () => {
    let task = run(function* Main() {
      yield* spawn(function* Boomer() {
        throw new Error("boom");
      });

      yield* suspend();
    });

    await expect(task).rejects.toMatchObject({ message: "boom" });
  });

  it("can halt itself", async () => {
    let task: Task<void> = run(function* () {
      yield* sleep(0);
      yield* task.halt();
    });

    await expect(task).rejects.toMatchObject({ message: "halted" });
  });

  it("can halt itself between yield points", async () => {
    let task: Task<void> = run(function* root() {
      yield* sleep(0);

      yield* spawn(function* child() {
        yield* task.halt();
      });

      yield* suspend();
    });

    await expect(task).rejects.toMatchObject({ message: "halted" });
  });

  it("can delay halt if child fails", async () => {
    let didRun = false;
    let task = run(function* Main() {
      yield* spawn(function* willBoom() {
        throw new Error("boom");
      });
      try {
        yield* suspend();
      } finally {
        yield* sleep(20);
        didRun = true;
      }
    });

    await expect(task).rejects.toHaveProperty("message", "boom");
    expect(didRun).toEqual(true);
  });

  it("handles error in entering suspend point", async () => {
    let error = new Error("boom!");
    let task = run(function* () {
      yield* action(() => {
        throw error;
      });
    });

    await expect(task).rejects.toEqual(error);
  });

  it("handles errors in exiting suspend points", async () => {
    let error = new Error("boom!");
    let task = run(function* () {
      yield* action<void>(() => () => {
        throw error;
      });
    });

    await expect(task.halt()).rejects.toEqual(error);
  });

  it("can throw error when child blows up", async () => {
    let task = run(function* Main() {
      yield* spawn(function* Boomer() {
        throw new Error("boom");
      });
      try {
        yield* suspend();
      } finally {
        throw new Error("bang");
      }
    });

    await expect(task).rejects.toHaveProperty("message", "bang");
  });

  it("throws an error in halt() if its finally block blows up", async () => {
    let task = run(function* main() {
      try {
        yield* suspend();
      } finally {
        throw new Error("moo");
      }
    });

    await expect(task.halt()).rejects.toMatchObject({ message: "moo" });
  });

  it("propagates errors", async () => {
    try {
      await run(function* () {
        throw new Error("boom");
      });
      throw new Error("expected error to propagate");
    } catch (error) {
      expect((error as Error).message).toEqual("boom");
    }
  });

  it("propagates errors from promises", async () => {
    try {
      await run(function* () {
        yield* until(Promise.reject(new Error("boom")));
      });
      throw new Error("expected error to propagate");
    } catch (error) {
      expect((error as Error).message).toEqual("boom");
    }
  });

  it("successfully halts when task fails, but shutdown succeeds ", async () => {
    let task = run(function* () {
      throw new Error("boom!");
    });

    await expect(task).rejects.toHaveProperty("message", "boom!");
    await expect(task.halt()).resolves.toBe(undefined);
  });

  it("destroys its scope when halted", async () => {
    let scope: Scope | undefined;

    let task = run(function* () {
      scope = yield* useScope();
      createScope(scope);
      yield* suspend();
    });

    await task.halt();

    assert(scope !== undefined);
    expect(scope.expect(Children).size).toEqual(0);
  });

  it("destroys its scope when completing successfully", async () => {
    let scope = await run(function* () {
      let parent = yield* useScope();
      createScope(parent);
      return parent;
    });

    expect(scope.expect(Children).size).toEqual(0);
  });

  it("can be disposed with 'await using'", async () => {
    let halted = false;

    {
      await using _ = run(function* () {
        try {
          yield* suspend();
        } finally {
          halted = true;
        }
      });
    }

    expect(halted).toEqual(true);
  });

  it("should throw when 'halt' is invoked after 'await using'", async () => {
    let halted = false;
    let error: Error | undefined;

    let task = run(function* () {
      try {
        yield* suspend();
      } finally {
        halted = true;
      }
    });

    {
      await using _ = task;
    }

    await task.catch((e) => error = e);

    expect(error).toBeDefined();
    expect(error?.message).toEqual("halted");
    expect(halted).toEqual(true);
  });
});
