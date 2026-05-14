import { run } from "../lib/run.ts";
import { trap } from "../lib/trap.ts";
import { sleep, spawn, suspend, withResolvers } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("trap", () => {
  it("surfaces a body throw to the caller", async () => {
    let task = run(function* () {
      try {
        yield* trap(function* () {
          throw new Error("boom!");
        });
      } catch (err) {
        return err;
      }
    });

    await task;

    await expect(task).resolves.toMatchObject({ message: "boom!" });
  });

  it("surfaces a spawned-child error to the caller", async () => {
    let task = run(function* () {
      try {
        yield* trap(function* () {
          yield* spawn(function* () {
            throw new Error("boom!");
          });
          yield* suspend();
        });
      } catch (err) {
        return err;
      }
    });

    await expect(task).resolves.toMatchObject({ message: "boom!" });
  });

  it("unwinds through an error trap when halting", async () => {
    let events: string[] = [];
    let task = run(function* () {
      try {
        yield* trap(function* () {
          try {
            yield* suspend();
          } finally {
            events.push("trap-body-finally");
          }
        });
        events.push("after-trap-unreachable");
      } catch (err) {
        events.push(`caught:${(err as Error).message}`);
      } finally {
        events.push("body-finally");
      }
    });

    await task.halt();

    expect(events).toEqual(["trap-body-finally", "body-finally"]);
    expect(events).not.toContain("after-trap-unreachable");
    expect(events.some((e) => e.startsWith("caught:"))).toBe(false);
  });

  it("drops errors that are raised while a task is already halting", async () => {
    let release = withResolvers<void>();

    let task = run(function* () {
      try {
        yield* trap(function* () {
          yield* spawn(function* () {
            yield* release.operation;
            throw new Error("child-boom");
          });
          try {
            yield* suspend();
          } finally {
            yield* release.operation;
          }
        });
      } catch (err) {
        return err;
      }
    });

    // halt enters trap's body, suspend exits, finally awaits release.
    // .then triggers signal eagerly so halt is in flight before release.
    let halted = task.halt().then((id) => id);

    release.resolve();

    await expect(halted).resolves.toBeUndefined();

    await expect(task).rejects.toHaveProperty("message", "halted");
  });

  it("unwinds an error through multiple traps", async () => {
    let task = run(function* () {
      try {
        yield* trap(function* outer() {
          yield* trap(function* inner() {
            throw new Error("inner-boom");
          });
        });
      } catch (error) {
        return error;
      }
    });

    await expect(task).resolves.toMatchObject({ message: "inner-boom" });
  });

  it("allows catching errors that are thrown synchronously", async () => {
    let events: string[] = [];
    let task = run(function* () {
      try {
        yield* trap(function* () {
          yield* spawn(function* () {
            throw new Error("sync-boom");
          });
          events.push("between-spawn-and-yield");
          yield* sleep(0);
          events.push("after-sleep-unreachable");
        });
      } catch (err) {
        events.push(`caught:${(err as Error).message}`);
      }
    });

    await task;

    expect(events).toContain("between-spawn-and-yield");
    expect(events).not.toContain("after-sleep-unreachable");
    expect(events).toContain("caught:sync-boom");
  });
});
