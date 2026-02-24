import { action, run, sleep, spawn, suspend, until } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import { DivergenceError } from "../lib/durable/types.ts";
import type { DurableEvent, EffectResolved, EffectErrored } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract only the user-facing effect events from the stream,
 * filtering out internal Effection infrastructure effects like
 * useCoroutine() and useScope().
 */
function userEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read()
    .map((e) => e.event)
    .filter((e) => {
      if (e.type === "effect:yielded") {
        // Filter out internal effects
        let desc = e.description;
        if (desc === "useCoroutine()" || desc.startsWith("do <")) {
          return false;
        }
      }
      if (e.type === "effect:resolved" || e.type === "effect:errored") {
        // Keep only events whose effectId corresponds to a user event
        // We'll handle this via pairing below
      }
      return true;
    });
}

/**
 * Helper: extract paired (yielded, resolved/errored) user-facing effect events.
 * Returns arrays of [yielded, resolution] pairs.
 */
function userEffectPairs(stream: InMemoryDurableStream): Array<[DurableEvent, DurableEvent]> {
  let events = stream.read().map((e) => e.event);
  let pairs: Array<[DurableEvent, DurableEvent]> = [];

  for (let i = 0; i < events.length - 1; i++) {
    let ev = events[i];
    if (ev.type !== "effect:yielded") continue;
    // Skip internal effects
    if (ev.description === "useCoroutine()" || ev.description.startsWith("do <")) continue;

    // Look for the matching resolution
    let next = events[i + 1];
    if (
      next &&
      (next.type === "effect:resolved" || next.type === "effect:errored") &&
      next.effectId === ev.effectId
    ) {
      pairs.push([ev, next]);
      i++; // skip the resolution event
    }
  }

  return pairs;
}

describe("durable run", () => {
  describe("stream recording", () => {
    it("records scope lifecycle events for a pure return (no user-facing effects)", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        return "hello";
      }, { stream });

      // A pure return has no user-facing effects, but the scope lifecycle
      // events are recorded: scope:created (root) and scope:destroyed (root).
      // The task scope also gets scope:created / scope:destroyed.
      let events = stream.read().map((e) => e.event);
      let userEffects = events.filter((e) => e.type === "effect:yielded" || e.type === "effect:resolved" || e.type === "effect:errored");
      expect(userEffects.length).toEqual(0);

      // Scope lifecycle events should be present
      let scopeCreated = events.filter((e) => e.type === "scope:created");
      let scopeDestroyed = events.filter((e) => e.type === "scope:destroyed");
      expect(scopeCreated.length).toBeGreaterThanOrEqual(1);
      expect(scopeDestroyed.length).toBeGreaterThanOrEqual(1);
    });

    it("records events for action effects", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let value = yield* action<number>((resolve) => {
          resolve(42);
          return () => {};
        });
        return value;
      }, { stream });

      let pairs = userEffectPairs(stream);
      expect(pairs.length).toEqual(1);

      let [yielded, resolved] = pairs[0];
      expect(yielded.type).toEqual("effect:yielded");
      if (yielded.type === "effect:yielded") {
        expect(yielded.description).toEqual("action");
      }
      expect(resolved.type).toEqual("effect:resolved");
      if (resolved.type === "effect:resolved") {
        expect(resolved.value).toEqual(42);
      }
    });

    it("records events for multi-step workflows", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        let a = yield* until(Promise.resolve(10));
        let b = yield* until(Promise.resolve(20));
        return a + b;
      }, { stream });

      expect(result).toEqual(30);

      let pairs = userEffectPairs(stream);
      expect(pairs.length).toEqual(2);

      // First effect
      if (pairs[0][1].type === "effect:resolved") {
        expect(pairs[0][1].value).toEqual(10);
      }

      // Second effect
      if (pairs[1][1].type === "effect:resolved") {
        expect(pairs[1][1].value).toEqual(20);
      }
    });

    it("records effect:errored events when an effect fails", async () => {
      let stream = new InMemoryDurableStream();

      try {
        await run(function* () {
          yield* until(Promise.reject(new Error("boom")));
        }, { stream });
      } catch {
        // expected
      }

      let pairs = userEffectPairs(stream);
      expect(pairs.length).toEqual(1);

      let [yielded, errored] = pairs[0];
      expect(yielded.type).toEqual("effect:yielded");
      expect(errored.type).toEqual("effect:errored");
      if (errored.type === "effect:errored") {
        expect(errored.error.message).toEqual("boom");
      }
    });

    it("records events for sleep effects", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* sleep(1);
        return "done";
      }, { stream });

      let pairs = userEffectPairs(stream);
      expect(pairs.length).toEqual(1);
      expect(pairs[0][1].type).toEqual("effect:resolved");
    });

    it("records events when errors are caught and execution continues", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        let value: number;
        try {
          yield* until(Promise.reject(new Error("oops")));
          value = 0;
        } catch {
          value = yield* until(Promise.resolve(99));
        }
        return value;
      }, { stream });

      expect(result).toEqual(99);

      let pairs = userEffectPairs(stream);
      // First effect: errored, second effect: resolved
      expect(pairs.length).toEqual(2);
      expect(pairs[0][1].type).toEqual("effect:errored");
      expect(pairs[1][1].type).toEqual("effect:resolved");

      if (pairs[1][1].type === "effect:resolved") {
        expect(pairs[1][1].value).toEqual(99);
      }
    });
  });

  describe("replay", () => {
    it("replays effects from a pre-recorded stream", async () => {
      // Step 1: Record a live execution
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let value = yield* action<number>((resolve) => {
          resolve(42);
          return () => {};
        });
        return value;
      }, { stream: recordStream });

      // Step 2: Create a new stream from the recorded events
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      // Step 3: Replay — the effect should NOT execute
      let effectExecuted = false;
      let result = await run(function* () {
        let value = yield* action<number>((resolve) => {
          effectExecuted = true;
          resolve(999);
          return () => {};
        });
        return value;
      }, { stream: replayStream });

      expect(effectExecuted).toEqual(false);
      expect(result).toEqual(42);
    });

    it("replays multiple effects from a pre-recorded stream", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let a = yield* action<number>((resolve) => {
          resolve(10);
          return () => {};
        });
        let b = yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        });
        return a + b;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let execCount = 0;
      let result = await run(function* () {
        let a = yield* action<number>((resolve) => {
          execCount++;
          resolve(100);
          return () => {};
        });
        let b = yield* action<number>((resolve) => {
          execCount++;
          resolve(200);
          return () => {};
        });
        return a + b;
      }, { stream: replayStream });

      expect(execCount).toEqual(0);
      expect(result).toEqual(30);
    });

    it("replays errors from a pre-recorded stream", async () => {
      // Step 1: Record an error
      let recordStream = new InMemoryDurableStream();

      try {
        await run(function* () {
          yield* until(Promise.reject(new Error("stored error")));
        }, { stream: recordStream });
      } catch {
        // expected
      }

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectExecuted = false;
      try {
        await run(function* () {
          yield* action<number>((resolve) => {
            effectExecuted = true;
            resolve(42);
            return () => {};
          });
        }, { stream: replayStream });
        throw new Error("should have thrown");
      } catch (error) {
        expect((error as Error).message).toEqual("stored error");
      }

      expect(effectExecuted).toEqual(false);
    });
  });

  describe("mid-workflow resume", () => {
    it("replays stored effects then continues live", async () => {
      // Step 1: Record a two-effect workflow
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let a = yield* action<number>((resolve) => {
          resolve(10);
          return () => {};
        });
        let b = yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        });
        return a + b;
      }, { stream: recordStream });

      // Step 2: Take only the events up to (and including) the first
      // user effect resolution. This simulates a crash after the first
      // effect completed but before the second.
      let allEvents = recordStream.read().map((e) => e.event);

      // Find the first user action resolved event
      let cutIndex = -1;
      for (let i = 0; i < allEvents.length; i++) {
        let ev = allEvents[i];
        if (ev.type === "effect:resolved") {
          // Check if this is from a user effect (not internal)
          if (i > 0 && allEvents[i - 1].type === "effect:yielded") {
            let yielded = allEvents[i - 1];
            if (
              yielded.type === "effect:yielded" &&
              yielded.description !== "useCoroutine()" &&
              !yielded.description.startsWith("do <")
            ) {
              cutIndex = i + 1;
              break;
            }
          }
        }
      }

      expect(cutIndex).toBeGreaterThan(0);

      // Create a partial stream (only events up to first user effect)
      let partialStream = InMemoryDurableStream.from(
        allEvents.slice(0, cutIndex),
      );

      // Step 3: Resume — first effect replays, second executes live
      let liveEffectExecuted = false;
      let result = await run(function* () {
        let a = yield* action<number>((resolve) => {
          resolve(100); // would be 100 if executed, but should replay as 10
          return () => {};
        });
        let b = yield* action<number>((resolve) => {
          liveEffectExecuted = true;
          resolve(20);
          return () => {};
        });
        return a + b;
      }, { stream: partialStream });

      expect(result).toEqual(30); // 10 (replayed) + 20 (live)
      expect(liveEffectExecuted).toEqual(true);
    });
  });

  describe("divergence detection", () => {
    it("throws DivergenceError when effect description doesn't match", async () => {
      // Record with one effect description
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* sleep(1);
        return "done";
      }, { stream: recordStream });

      // Replay with a different effect at the same position
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      try {
        await run(function* () {
          // Different operation at the same generator position
          // sleep uses description "sleep(1)" or similar, action uses "action"
          // But wait — internal effects (useCoroutine, useScope) will match
          // since they're the same. The divergence only happens at user effects.
          // Actually, since both runs go through the same infrastructure,
          // the internal effects will match. We need to create a scenario
          // where a user effect has a different description.
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "different-action");
          return "done";
        }, { stream: replayStream });
        throw new Error("should have thrown DivergenceError");
      } catch (error) {
        expect(error).toBeInstanceOf(DivergenceError);
      }
    });
  });

  describe("halt during durable execution", () => {
    it("records suspend effect and supports halt", async () => {
      let stream = new InMemoryDurableStream();
      let halted = false;

      let task = run(function* () {
        try {
          yield* suspend();
        } finally {
          halted = true;
        }
      }, { stream });

      await task.halt();
      expect(halted).toEqual(true);

      // The stream should have recorded events including the suspend
      let events = stream.read().map((e) => e.event);
      let suspendEvents = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("records cleanup effects in finally blocks", async () => {
      let stream = new InMemoryDurableStream();

      let task = run(function* () {
        try {
          yield* suspend();
        } finally {
          yield* sleep(1);
        }
      }, { stream });

      await task.halt();

      // Should have events for both the suspend and the sleep in finally
      let events = stream.read().map((e) => e.event);
      let yieldedDescs = events
        .filter((e) => e.type === "effect:yielded")
        .map((e) => e.type === "effect:yielded" ? e.description : "");

      expect(yieldedDescs).toContain("suspend");
      // sleep(1) goes through action internally
      expect(yieldedDescs.some((d) => d === "sleep(1)" || d === "action")).toEqual(true);
    });
  });

  describe("workflow:return", () => {
    it("emits workflow:return before scope:destroyed for a simple workflow", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        return 42;
      }, { stream });

      let events = stream.read().map((e) => e.event);

      // Find workflow:return events
      let workflowReturns = events.filter((e) => e.type === "workflow:return");
      expect(workflowReturns.length).toBeGreaterThanOrEqual(1);

      // The root scope's workflow:return should have value 42
      let rootReturn = workflowReturns.find(
        (e) => e.type === "workflow:return" && e.scopeId === "root",
      );
      expect(rootReturn).toBeDefined();
      if (rootReturn && rootReturn.type === "workflow:return") {
        expect(rootReturn.value).toEqual(42);
      }

      // workflow:return should appear before scope:destroyed for the same scope
      let rootReturnIdx = events.indexOf(rootReturn!);
      let rootDestroyIdx = events.findIndex(
        (e) => e.type === "scope:destroyed" && e.scopeId === "root",
      );
      expect(rootReturnIdx).toBeLessThan(rootDestroyIdx);
    });

    it("emits workflow:return for spawned child tasks", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* sleep(1);
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = stream.read().map((e) => e.event);
      let workflowReturns = events.filter((e) => e.type === "workflow:return");

      // Should have workflow:return for at least the child task scope and root
      expect(workflowReturns.length).toBeGreaterThanOrEqual(2);

      // Find the child scope's workflow:return (not root, not scope-1)
      let childReturns = workflowReturns.filter(
        (e) => e.type === "workflow:return" && e.scopeId !== "root",
      );
      // At least one child scope should have returned 42
      let has42 = childReturns.some(
        (e) => e.type === "workflow:return" && e.value === 42,
      );
      expect(has42).toEqual(true);
    });

    it("does not emit workflow:return when workflow errors", async () => {
      let stream = new InMemoryDurableStream();

      try {
        await run(function* () {
          throw new Error("boom");
        }, { stream });
      } catch {
        // expected
      }

      let events = stream.read().map((e) => e.event);
      let workflowReturns = events.filter((e) => e.type === "workflow:return");

      // No workflow:return for the root scope since it errored
      let rootReturn = workflowReturns.find(
        (e) => e.type === "workflow:return" && e.scopeId === "root",
      );
      expect(rootReturn).toBeUndefined();
    });

    it("does not emit workflow:return when halted", async () => {
      let stream = new InMemoryDurableStream();

      let task = run(function* () {
        yield* suspend();
        return "unreachable";
      }, { stream });

      await task.halt();

      let events = stream.read().map((e) => e.event);
      // No workflow:return for the main task scope (scope-1) since it was halted
      // Root scope also should not have workflow:return since task was halted
      let rootReturn = events.find(
        (e) => e.type === "workflow:return" && e.scopeId === "root",
      );
      expect(rootReturn).toBeUndefined();
    });

    it("workflow:return is replayed correctly", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();
      await run(function* () {
        yield* sleep(1);
        return "hello";
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let result = await run(function* () {
        yield* sleep(1);
        return "hello";
      }, { stream: replayStream });

      expect(result).toEqual("hello");
    });
  });

  describe("durable spawn resume", () => {
    it("replays a full spawn workflow without re-executing child effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-work");
          return 42;
        });
        return yield* task;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let childExecuted = false;
      let result = await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            childExecuted = true;
            resolve();
            return () => {};
          }, "child-work");
          return 42;
        });
        return yield* task;
      }, { stream: replayStream });

      expect(childExecuted).toEqual(false);
      expect(result).toEqual(42);
    });

    it("resumes mid-workflow after spawn completes", async () => {
      // Step 1: Record a workflow where parent spawns child and awaits result
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-work");
          return 10;
        });
        let childResult = yield* task;
        // Second user effect after the spawn completes
        let extra = yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        }, "parent-extra");
        return childResult + extra;
      }, { stream: recordStream });

      // Step 2: Create a partial stream — include everything up to and
      // including the child's completion, but NOT the parent's second effect.
      let allEvents = recordStream.read().map((e) => e.event);

      // Find the parent's "parent-extra" effect:yielded — cut before it
      let parentExtraIdx = allEvents.findIndex(
        (e) => e.type === "effect:yielded" &&
          e.description === "parent-extra",
      );
      expect(parentExtraIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        allEvents.slice(0, parentExtraIdx),
      );

      // Step 3: Resume — child replays, parent continues live
      let childExecuted = false;
      let parentExtraExecuted = false;

      let result = await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            childExecuted = true;
            resolve();
            return () => {};
          }, "child-work");
          return 10;
        });
        let childResult = yield* task;
        let extra = yield* action<number>((resolve) => {
          parentExtraExecuted = true;
          resolve(20);
          return () => {};
        }, "parent-extra");
        return childResult + extra;
      }, { stream: partialStream });

      // Child should have been replayed (not re-executed)
      expect(childExecuted).toEqual(false);
      // Parent's second effect should have executed live
      expect(parentExtraExecuted).toEqual(true);
      expect(result).toEqual(30);
    });

    it("detects divergence when child effect description changes", async () => {
      // Step 1: Record with one child effect description
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "original-work");
          return 42;
        });
        return yield* task;
      }, { stream: recordStream });

      // Step 2: Partial replay — truncate before the child's effect resolves
      // so the child must re-execute with the divergent description.
      // We keep scope events and the child's effect:yielded but remove
      // its resolution, forcing live execution of the child.
      let events = recordStream.read().map((e) => e.event);
      let childResolvedIdx = events.findIndex(
        (e) => e.type === "effect:resolved" && e.effectId ===
          (events.find((ev) => ev.type === "effect:yielded" && ev.description === "original-work") as any)?.effectId,
      );
      expect(childResolvedIdx).toBeGreaterThan(0);

      // Truncate at the child's resolution — child effect is yielded but
      // not resolved, so the child must re-execute.
      let partialStream = InMemoryDurableStream.from(events.slice(0, childResolvedIdx));

      try {
        await run(function* () {
          let task = yield* spawn(function* () {
            yield* action<void>((resolve) => {
              resolve();
              return () => {};
            }, "changed-work"); // Different description!
            return 42;
          });
          return yield* task;
        }, { stream: partialStream });
        throw new Error("should have thrown DivergenceError");
      } catch (error) {
        expect(error).toBeInstanceOf(DivergenceError);
      }
    });
  });
});
