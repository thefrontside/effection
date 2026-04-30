// deno-lint-ignore-file no-unsafe-finally
import {
  createScope,
  type Operation,
  run,
  sleep,
  spawn,
  suspend,
  type Task,
  until,
  useScope,
} from "../mod.ts";
import { Children } from "../lib/contexts.ts";
import { expect } from "./suite.ts";

// These tests encode general invariants the cancellation model is supposed
// to uphold. Each one corresponds to a class of bug, not a specific repro:
//
//  Principle 1 (issue #1154 problem 2): a forced unwind must remain a forced
//  unwind even when a finally block contains a yield. The consumer of a
//  yield*'d operation must NEVER observe a normal return value after halt.
//
//  Principle 2 (issue #1154 problem 1): every yield in a finally block must
//  run to completion when the surrounding task is cancelled. A halt during
//  cleanup must not skip subsequent cleanup steps.
//
//  Principle 3 (issue #1153 generalized): task.halt() must not resolve until
//  every destructor and finalizer associated with the task has finished, no
//  matter what else is happening concurrently.
//
//  Principle 4 (issue #1159 generalized): the Promise and Operation surfaces
//  of task.halt() must produce the same observable post-conditions. Mixing
//  them must not deadlock.
//
//  Principle 5 (issue #1160 generalized): yield* task.halt() from inside the
//  task itself must not silently hang.
//
// Each test is its own top-level Deno.test (not nested in describe) and
// disables op/resource sanitization so a hang or leak in one cannot block
// discovery of the others.

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`TIMEOUT:${label}`)), ms)
    ),
  ]);
}

function defineTest(name: string, fn: () => Promise<void>) {
  Deno.test({ name, sanitizeOps: false, sanitizeResources: false, fn });
}

defineTest(
  "Principle 1: forced unwind is not converted into a normal value when finally yields",
  async () => {
    let observation: unknown = "untouched";

    function* inner(): Operation<number> {
      try {
        yield* suspend();
        return 999;
      } finally {
        yield* sleep(0);
      }
    }

    await withTimeout(
      run(function* () {
        let child = yield* spawn(function* () {
          let value = yield* inner();
          observation = value;
        });
        yield* sleep(1);
        yield* child.halt();
      }),
      1000,
      "principle-1",
    );

    expect(observation).toEqual("untouched");
  },
);

defineTest(
  "Principle 2: cancellation during cleanup1 does not skip cleanup2 in the same finally",
  async () => {
    let events: string[] = [];
    let cleanup1Started = Promise.withResolvers<void>();
    let releaseCleanup1 = Promise.withResolvers<void>();

    let task = run(function* () {
      try {
        yield* sleep(0);
      } finally {
        events.push("cleanup1:start");
        cleanup1Started.resolve();
        yield* until(releaseCleanup1.promise);
        events.push("cleanup1:end");
        yield* sleep(0);
        events.push("cleanup2:end");
      }
    });

    await cleanup1Started.promise;
    let halted = task.halt();
    await new Promise<void>((r) => setTimeout(r, 5));
    releaseCleanup1.resolve();
    await withTimeout(halted.catch(() => {}), 1000, "principle-2-halted");
    await withTimeout(task.catch(() => {}), 1000, "principle-2-task");

    expect(events).toEqual(["cleanup1:start", "cleanup1:end", "cleanup2:end"]);
  },
);

defineTest(
  "Principle 3: halt waits for cleanup even if a sibling fails during teardown",
  async () => {
    let events: string[] = [];
    let cleanupEntered = Promise.withResolvers<void>();
    let releaseCleanup = Promise.withResolvers<void>();
    let releaseSibling = Promise.withResolvers<void>();

    let task = run(function* () {
      yield* spawn(function* () {
        yield* until(releaseSibling.promise);
        throw new Error("sibling boom");
      });
      try {
        yield* suspend();
      } finally {
        events.push("cleanup:enter");
        cleanupEntered.resolve();
        yield* until(releaseCleanup.promise);
        events.push("cleanup:exit");
      }
    });

    // .catch attaches a handler which triggers halt on the v4 thenable.
    // The returned Promise resolves when teardown is complete.
    let halted = task.halt().catch(() => {});
    await cleanupEntered.promise;
    releaseSibling.resolve();
    await new Promise<void>((r) => setTimeout(r, 5));
    releaseCleanup.resolve();

    await withTimeout(halted, 1000, "principle-3-halted");
    await withTimeout(task.catch(() => {}), 1000, "principle-3-task");

    expect(events).toEqual(["cleanup:enter", "cleanup:exit"]);
  },
);

defineTest(
  "Principle 4a: Promise-form halt does not deadlock a subsequent yield* task",
  async () => {
    let result = await withTimeout(
      run(function* () {
        let scope = yield* useScope();
        let child = scope.run(function* () {
          yield* suspend();
        });
        void child.halt().catch(() => {});
        try {
          yield* child;
          return "no-error";
        } catch (e) {
          return (e as Error).message;
        }
      }),
      1000,
      "principle-4a",
    );

    expect(result).toEqual("halted");
  },
);

defineTest(
  "Principle 4b: Promise and Operation halt surfaces produce the same observable state",
  async () => {
    let outcomes: string[] = [];

    for (let form of ["operation", "promise"] as const) {
      let task = run(function* () {
        yield* suspend();
      });

      if (form === "operation") {
        await withTimeout(
          run(function* () {
            yield* task.halt();
          }),
          1000,
          `principle-4b:${form}:halt`,
        );
      } else {
        await withTimeout(task.halt(), 1000, `principle-4b:${form}:halt`);
      }

      try {
        await withTimeout(task, 1000, `principle-4b:${form}:task`);
        outcomes.push(`${form}:ok`);
      } catch (e) {
        outcomes.push(`${form}:${(e as Error).message}`);
      }
    }

    expect(outcomes).toEqual(["operation:halted", "promise:halted"]);
  },
);

defineTest(
  "Principle 5: self-halt terminates within a bounded time",
  async () => {
    let task: Task<void> = run(function* () {
      yield* sleep(0);
      yield* task.halt();
    });

    let result = await withTimeout(
      task.then(() => "resolved", (e) => `rejected:${(e as Error).message}`),
      1000,
      "principle-5",
    ).catch((e) => (e as Error).message);

    expect(result).not.toEqual("TIMEOUT:principle-5");
  },
);

defineTest(
  "Phase 2: task.halt() synchronously triggers halt without needing .then or await",
  async () => {
    let cleanedUp = false;
    let task = run(function* () {
      try {
        yield* suspend();
      } finally {
        cleanedUp = true;
      }
    });

    // give the task a tick to enter suspend
    await new Promise<void>((r) => setTimeout(r, 0));

    // On v4: task.halt() returns a dormant thenable; no halt is triggered
    // until .then/.catch/.finally is invoked. After Phase 2: calling
    // task.halt() synchronously interrupts the top delimiter, so the task
    // begins unwinding immediately even if the returned thenable is
    // discarded.
    task.halt();

    // give the unwind a chance to run
    await new Promise<void>((r) => setTimeout(r, 10));

    expect(cleanedUp).toEqual(true);
  },
);

defineTest(
  "Phase 3: yield* task.halt() from inside the task throws SelfHaltError",
  async () => {
    let captured: Error | undefined;
    let task: Task<void> = run(function* () {
      yield* sleep(0);
      try {
        yield* task.halt();
      } catch (e) {
        captured = e as Error;
      }
    });

    await withTimeout(task.catch(() => {}), 1000, "phase-3");
    expect(captured?.name).toEqual("SelfHaltError");
  },
);
