import { createCoroutine, SettleContext } from "../lib/coroutine.ts";
import { Nothing } from "../lib/maybe.ts";
import { sleep } from "../lib/mod.ts";
import { Ok } from "../lib/result.ts";
import { createScope } from "../lib/scope.ts";
import { describe, expect, it } from "./suite.ts";

describe("Coroutine", () => {
  it("can run a simple operation", async () => {
    await using scope = createScope();
    let { resume: next, future } = createCoroutine({
      scope,
      *operation() {
        return "hello world";
      },
    });

    next(Ok());

    await expect(future).resolves.toEqual({
      exists: true,
      value: { ok: true, value: "hello world" },
    });
  });

  it("can run an operation with yield points", async () => {
    let operations: string[] = [];
    await using scope = createScope();
    let { resume: next, future } = createCoroutine({
      scope,
      *operation() {
        operations.push("sleep:before");
        yield* sleep(0);
        operations.push("sleep:after");
        return "hello world";
      },
    });

    next(Ok());

    await expect(future).resolves.toEqual({
      exists: true,
      value: { ok: true, value: "hello world" },
    });

    expect(operations).toEqual([
      "sleep:before",
      "sleep:after",
    ]);
  });

  it("will settle as an error when its body throws", async () => {
    await using scope = createScope();
    let { resume: next, future } = createCoroutine({
      scope,
      *operation() {
        throw new Error("boom!");
      },
    });

    next(Ok());

    await expect(future).resolves.toMatchObject({
      exists: true,
      value: { ok: false, error: { message: "boom!" } },
    });
  });

  it("allows overriding the settlement value", async () => {
    await using scope = createScope();
    scope.set(SettleContext, (_, next) => next(Nothing()));
    let { resume: next, future } = createCoroutine({
      scope,
      *operation() {
        "return hello world";
      },
    });

    next(Ok());

    await expect(future).resolves.toMatchObject({
      exists: false,
    });
  });

  it("uses 'return' for a single iteration when unwound", async () => {
    let events: string[] = [];
    await using scope = createScope();
    let routine = createCoroutine({
      scope,
      *operation() {
        try {
          events.push("before");
          yield* sleep(1000);
          events.push("after-unreachable");
        } finally {
          events.push("finally:enter");
          yield* sleep(0);
          events.push("finally:exit");
        }
      },
    });

    routine.resume(Ok());

    routine.unwind();

    await routine.future;

    expect(events).toEqual([
      "before",
      "finally:enter",
      "finally:exit",
    ]);
    expect(events).not.toContain("after-unreachable");
  });

  it("it raises errors that happen in effect.enter()", async () => {
    await using scope = createScope();
    let { resume: next, future } = createCoroutine({
      scope,
      *operation() {
        try {
          yield {
            description: "throws on enter",
            enter() {
              throw new Error("boom!");
            },
          };
          return "unreachable";
        } catch (error) {
          return error;
        }
      },
    });

    next(Ok());

    await expect(future).resolves.toMatchObject({
      exists: true,
      value: { ok: true, value: { message: "boom!" } },
    });
  });
});
