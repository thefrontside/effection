import {
  action,
  createChannel,
  createSignal,
  each,
  run,
  sleep,
  spawn,
} from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

// ── Signal ─────────────────────────────────────────────────────────
//
// Signal and channel rely on side effects inside effect.enter() callbacks
// (queue buffer population via signal.send) for downstream behavior.
// During full replay, effect.enter() is skipped, so the queue buffer
// never gets populated and downstream subscription.next() calls diverge.
//
// Therefore these tests cover:
//   - Recording: verify event structure
//   - Mid-workflow resume: verify live continuation after replay frontier
//
// Full replay of signal/channel send+receive is a known limitation
// of the current DurableReducer design (side-effect coupling).

describe("durable createSignal", () => {
  describe("recording", () => {
    it("records events for signal send/receive with blocking consumer", async () => {
      let stream = new InMemoryDurableStream();

      let signal = createSignal<string, void>();
      let result: string[] = [];

      await run(function* () {
        // Spawn producer that sends after a delay (consumer blocks on next)
        yield* spawn(function* () {
          yield* sleep(1);
          signal.send("msg1");
          signal.send("msg2");
          signal.close();
        });

        // Consume via each() — the idiomatic pattern
        for (let value of yield* each(signal)) {
          result.push(value);
          yield* each.next();
        }
      }, { stream });

      expect(result).toEqual(["msg1", "msg2"]);

      let events = allEvents(stream);

      // Should have scope lifecycle events for: root, task, producer, each-subscription, signal-resource
      let scopeCreated = events.filter((e) => e.type === "scope:created");
      expect(scopeCreated.length).toBeGreaterThanOrEqual(4);

      // Should have a sleep(1) effect from the producer
      let sleepEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "sleep(1)",
      );
      expect(sleepEffects.length).toEqual(1);

      // Should have at least one "action" effect from queue.next()
      // (the first next() call blocks, creating an action effect)
      let actionEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "action",
      );
      expect(actionEffects.length).toBeGreaterThanOrEqual(1);

      // The action resolution should contain the iterator result
      let actionEffect = actionEffects[0];
      let effectId = actionEffect.type === "effect:yielded"
        ? actionEffect.effectId
        : "";
      let resolution = events.find(
        (e) => e.type === "effect:resolved" && e.effectId === effectId,
      );
      expect(resolution).toBeDefined();
      if (resolution && resolution.type === "effect:resolved") {
        // queue.next() resolves with an IteratorResult
        expect(resolution.value).toHaveProperty("done", false);
        expect(resolution.value).toHaveProperty("value", "msg1");
      }

      // Signal's resource scope should have a suspend effect
      let suspendEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendEffects.length).toBeGreaterThanOrEqual(1);
    });

    it("records scope hierarchy for signal resource", async () => {
      let stream = new InMemoryDurableStream();

      let signal = createSignal<string, void>();

      await run(function* () {
        let subscription = yield* signal;
        signal.send("test");
        signal.close();
        let next = yield* subscription.next();
        while (!next.done) {
          next = yield* subscription.next();
        }
      }, { stream });

      let events = allEvents(stream);

      // Signal subscription creates: root -> task scope -> signal resource child scope
      let scopeCreated = events.filter(
        (e) => e.type === "scope:created",
      ) as Array<{
        type: "scope:created";
        scopeId: string;
        parentScopeId?: string;
      }>;

      // root, task scope, and at least one resource child scope
      expect(scopeCreated.length).toBeGreaterThanOrEqual(3);

      // The task scope should be a child of root
      let taskScope = scopeCreated.find((e) => e.parentScopeId === "root");
      expect(taskScope).toBeDefined();

      // The resource child scope should be a child of the task scope
      let resourceScope = scopeCreated.find(
        (e) =>
          e.parentScopeId === taskScope!.scopeId &&
          e.scopeId !== taskScope!.scopeId,
      );
      expect(resourceScope).toBeDefined();
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes signal consumption after replay frontier", async () => {
      // Step 1: Record with a pre-marker action before signal setup
      let recordStream = new InMemoryDurableStream();

      let signal = createSignal<string, void>();

      await run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "pre-signal-work");

        yield* spawn(function* () {
          yield* sleep(1);
          signal.send("first");
          signal.send("second");
          signal.close();
        });

        let collected: string[] = [];
        for (let value of yield* each(signal)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: recordStream });

      // Step 2: Truncate after pre-signal-work resolves (before
      // signal setup). The entire signal/channel interaction
      // must execute live to preserve the timing relationship
      // between producer sends and consumer queue.next() calls.
      let events = recordStream.read().map((e) => e.event);

      let preWorkYielded = events.find(
        (e) =>
          e.type === "effect:yielded" &&
          e.description === "pre-signal-work",
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

      // Step 3: Resume — pre-signal-work replays, then signal/each
      // enters live mode with proper timing
      let signal2 = createSignal<string, void>();
      let liveEffects: string[] = [];

      let result = await run(function* () {
        yield* action<void>((resolve) => {
          liveEffects.push("pre-signal-work");
          resolve();
          return () => {};
        }, "pre-signal-work");

        yield* spawn(function* () {
          yield* sleep(1);
          liveEffects.push("producer-resumed");
          signal2.send("first");
          signal2.send("second");
          signal2.close();
        });

        let collected: string[] = [];
        for (let value of yield* each(signal2)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: partialStream });

      // pre-signal-work was replayed (not re-executed)
      expect(liveEffects).not.toContain("pre-signal-work");
      // Producer ran live after the replay frontier
      expect(liveEffects).toContain("producer-resumed");
      expect(result).toEqual(["first", "second"]);
    });
  });
});

// ── Channel ────────────────────────────────────────────────────────

describe("durable createChannel", () => {
  describe("recording", () => {
    it("records events for channel send/receive", async () => {
      let stream = new InMemoryDurableStream();

      let result: string[] = [];
      await run(function* () {
        let channel = createChannel<string, void>();
        let subscription = yield* channel;

        // channel.send uses lift() which produces "action" effects
        yield* channel.send("hello");
        yield* channel.send("world");
        yield* channel.close();

        let next = yield* subscription.next();
        while (!next.done) {
          result.push(next.value);
          next = yield* subscription.next();
        }
      }, { stream });

      expect(result).toEqual(["hello", "world"]);

      let events = allEvents(stream);

      // channel.send produces "action" effects via lift
      let actionEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "action",
      );
      // At least 3 actions: send("hello"), send("world"), close()
      expect(actionEffects.length).toBeGreaterThanOrEqual(3);

      // Each send/close action should have a resolution
      for (let effect of actionEffects) {
        let effectId = effect.type === "effect:yielded"
          ? effect.effectId
          : "";
        let resolution = events.find(
          (e) =>
            (e.type === "effect:resolved" || e.type === "effect:errored") &&
            e.effectId === effectId,
        );
        expect(resolution).toBeDefined();
      }
    });

    it("records workflow:return with collected values", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let channel = createChannel<string, void>();
        let subscription = yield* channel;

        yield* channel.send("hello");
        yield* channel.send("world");
        yield* channel.close();

        let collected: string[] = [];
        let next = yield* subscription.next();
        while (!next.done) {
          collected.push(next.value);
          next = yield* subscription.next();
        }
        return collected;
      }, { stream });

      let events = allEvents(stream);

      // The workflow:return for the task scope should contain the collected values
      let workflowReturns = events.filter(
        (e) => e.type === "workflow:return",
      );
      let taskReturn = workflowReturns.find(
        (e) =>
          e.type === "workflow:return" &&
          Array.isArray(e.value) &&
          e.value.length === 2,
      );
      expect(taskReturn).toBeDefined();
      if (taskReturn && taskReturn.type === "workflow:return") {
        expect(taskReturn.value).toEqual(["hello", "world"]);
      }
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes channel with live sends after replay frontier", async () => {
      // Step 1: Record — use a channel with a pre/post action marker
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "pre-channel-work");

        let channel = createChannel<string, void>();
        let subscription = yield* channel;

        yield* channel.send("hello");
        yield* channel.send("world");
        yield* channel.close();

        let collected: string[] = [];
        let next = yield* subscription.next();
        while (!next.done) {
          collected.push(next.value);
          next = yield* subscription.next();
        }
        return collected;
      }, { stream: recordStream });

      // Step 2: Truncate after "pre-channel-work" resolves
      // (before the channel subscribe resource is created)
      let events = recordStream.read().map((e) => e.event);
      let preWorkYielded = events.find(
        (e) =>
          e.type === "effect:yielded" &&
          e.description === "pre-channel-work",
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

      // Step 3: Resume — pre-channel-work replays, everything else executes live
      let liveEffects: string[] = [];
      let result = await run(function* () {
        yield* action<void>((resolve) => {
          liveEffects.push("pre-channel-work");
          resolve();
          return () => {};
        }, "pre-channel-work");

        let channel = createChannel<string, void>();
        let subscription = yield* channel;

        yield* channel.send("hello");
        yield* channel.send("world");
        yield* channel.close();

        let collected: string[] = [];
        let next = yield* subscription.next();
        while (!next.done) {
          collected.push(next.value);
          next = yield* subscription.next();
        }
        return collected;
      }, { stream: partialStream });

      // pre-channel-work should have been replayed (not re-executed)
      expect(liveEffects).not.toContain("pre-channel-work");
      // Channel send/receive should have executed live
      expect(result).toEqual(["hello", "world"]);
    });
  });
});
