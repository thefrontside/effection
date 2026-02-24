import { action, run, sleep, suspend, until } from "../mod.ts";
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
    it("records no events for a pure return (infrastructure effects are skipped)", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        return "hello";
      }, { stream });

      // A pure return has no user-facing effects.
      // Infrastructure effects (useCoroutine, useScope) are not recorded.
      let events = stream.read();
      expect(events.length).toEqual(0);
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
});
