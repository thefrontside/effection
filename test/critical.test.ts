import { critical, run, suspend, useScope } from "../mod.ts";
import { Cancelled, Shielded } from "../lib/contexts.ts";
import { describe, expect, it } from "./suite.ts";

describe("critical()", () => {
  it("sets Shielded=true on the scope while body runs", async () => {
    let observedInside: boolean | undefined;
    let observedOutside: boolean | undefined;

    await run(function* () {
      let outside = yield* useScope();
      observedOutside = outside.get(Shielded);

      yield* critical(function* () {
        let inside = yield* useScope();
        observedInside = inside.get(Shielded);
      });
    });

    expect(observedOutside).toEqual(false);
    expect(observedInside).toEqual(true);
  });

  it("restores Shielded after body completes", async () => {
    let observedAfter: boolean | undefined;

    await run(function* () {
      yield* critical(function* () {
        // do nothing
      });
      let scope = yield* useScope();
      observedAfter = scope.get(Shielded);
    });

    expect(observedAfter).toEqual(false);
  });

  it("returns the value of its body", async () => {
    let result = await run(function* () {
      return yield* critical(function* () {
        return 42;
      });
    });
    expect(result).toEqual(42);
  });

  it("propagates errors from its body", async () => {
    await expect(
      run(function* () {
        yield* critical(function* () {
          throw new Error("inside critical");
        });
      }),
    ).rejects.toMatchObject({ message: "inside critical" });
  });
});

describe("Cancelled context", () => {
  it("is set on a scope when the task's delimiter fires routine.return", async () => {
    let observedDuringCleanup: boolean | undefined;

    let task = run(function* () {
      let scope = yield* useScope();
      try {
        yield* suspend();
      } finally {
        observedDuringCleanup = scope.get(Cancelled);
      }
    });

    // give the task a tick to enter suspend
    await new Promise<void>((r) => setTimeout(r, 0));
    await task.halt();

    expect(observedDuringCleanup).toEqual(true);
  });

  it("is NOT set on a scope when the task completes naturally", async () => {
    let observedAtEnd: boolean | undefined;

    await run(function* () {
      let scope = yield* useScope();
      try {
        // do work that completes normally
      } finally {
        observedAtEnd = scope.get(Cancelled);
      }
    });

    expect(observedAtEnd).toEqual(false);
  });
});
