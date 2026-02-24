import { action, call, each, interval, race, run, sleep, spawn } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

// Interval wraps resource + createSignal + live setInterval.
// Like signal/channel, the timer callback (setInterval) is a side effect
// that populates the signal's queue buffer. During full replay,
// effect.enter() is skipped so the timer never fires and the queue
// buffer stays empty — downstream each.next() calls diverge.
//
// These tests cover recording and mid-workflow resume only.

describe("durable interval", () => {
  describe("recording", () => {
    it("records events for interval consumption", async () => {
      let stream = new InMemoryDurableStream();

      let tickCount = 0;
      await run(function* () {
        let task = yield* spawn(function* () {
          for (let _ of yield* each(interval(1))) {
            tickCount++;
            if (tickCount >= 3) {
              return tickCount;
            }
            yield* each.next();
          }
        });
        // Safety timeout
        return yield* race([
          task,
          call(function* () {
            yield* sleep(500);
            return "timeout";
          }),
        ]);
      }, { stream });

      expect(tickCount).toEqual(3);

      let events = allEvents(stream);

      // Should have scope lifecycle events
      let scopeCreated = events.filter((e) => e.type === "scope:created");
      // root, task, spawned task, each subscription, interval resource,
      // signal resource child (at least 5)
      expect(scopeCreated.length).toBeGreaterThanOrEqual(5);

      // Should have at least one "action" effect from queue.next()
      // (the consumer blocks waiting for timer ticks)
      let actionEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "action",
      );
      expect(actionEffects.length).toBeGreaterThanOrEqual(1);

      // Should have at least one suspend effect (from the signal resource)
      let suspendEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendEffects.length).toBeGreaterThanOrEqual(1);

      // Action resolutions should contain iterator results with void values
      for (let effect of actionEffects) {
        let effectId = effect.type === "effect:yielded"
          ? effect.effectId
          : "";
        let resolution = events.find(
          (e) => e.type === "effect:resolved" && e.effectId === effectId,
        );
        expect(resolution).toBeDefined();
        if (resolution && resolution.type === "effect:resolved") {
          expect(resolution.value).toHaveProperty("done", false);
        }
      }
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes interval with live ticks after replay frontier", async () => {
      // Step 1: Record with a pre-marker action before interval setup
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "pre-interval-work");

        let tickCount = 0;
        let task = yield* spawn(function* () {
          for (let _ of yield* each(interval(1))) {
            tickCount++;
            if (tickCount >= 3) {
              return tickCount;
            }
            yield* each.next();
          }
        });
        return yield* race([
          task,
          call(function* () {
            yield* sleep(500);
            return "timeout";
          }),
        ]);
      }, { stream: recordStream });

      // Step 2: Truncate after pre-interval-work resolves
      let events = recordStream.read().map((e) => e.event);

      let preWorkYielded = events.find(
        (e) =>
          e.type === "effect:yielded" &&
          e.description === "pre-interval-work",
      );
      let preWorkEffectId = preWorkYielded &&
          preWorkYielded.type === "effect:yielded"
        ? preWorkYielded.effectId
        : "";
      let preWorkResolvedIdx = events.findIndex(
        (e) => e.type === "effect:resolved" && e.effectId === preWorkEffectId,
      );
      expect(preWorkResolvedIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, preWorkResolvedIdx + 1),
      );

      // Step 3: Resume — pre-interval-work replays, then interval
      // executes live with real setInterval
      let liveEffects: string[] = [];
      let liveTicks = 0;

      let result = await run(function* () {
        yield* action<void>((resolve) => {
          liveEffects.push("pre-interval-work");
          resolve();
          return () => {};
        }, "pre-interval-work");

        let task = yield* spawn(function* () {
          for (let _ of yield* each(interval(1))) {
            liveTicks++;
            if (liveTicks >= 3) {
              return liveTicks;
            }
            yield* each.next();
          }
        });
        return yield* race([
          task,
          call(function* () {
            yield* sleep(500);
            return "timeout";
          }),
        ]);
      }, { stream: partialStream });

      // pre-interval-work was replayed (not re-executed)
      expect(liveEffects).not.toContain("pre-interval-work");
      // Interval ran live after the replay frontier
      expect(liveTicks).toEqual(3);
      expect(result).toEqual(3);
    });
  });
});
