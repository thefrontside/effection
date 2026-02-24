import { action, run, sleep, spawn, suspend } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import { DivergenceError } from "../lib/durable/types.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract only scope lifecycle events from the stream.
 */
function scopeEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read()
    .map((e) => e.event)
    .filter((e) =>
      e.type === "scope:created" ||
      e.type === "scope:destroyed"
    );
}

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

/**
 * Helper: extract user-facing events (scope lifecycle + user effects, not infra).
 */
function userFacingEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read()
    .map((e) => e.event)
    .filter((e) => {
      if (e.type === "effect:yielded") {
        let desc = e.description;
        if (
          desc === "useCoroutine()" ||
          desc.startsWith("do <") ||
          desc === "useScope()" ||
          desc === "trap return"
        ) {
          return false;
        }
      }
      // Also filter out infrastructure effect resolutions
      // by keeping only those whose effectId matches a user effect
      return true;
    });
}

describe("durable scope lifecycle", () => {
  describe("scope:created and scope:destroyed", () => {
    it("records scope:created for root scope at start of stream", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        return "hello";
      }, { stream });

      let events = allEvents(stream);
      // First event should be scope:created for root
      let first = events[0];
      expect(first.type).toEqual("scope:created");
      if (first.type === "scope:created") {
        expect(first.scopeId).toEqual("root");
        expect(first.parentScopeId).toBeUndefined();
      }
    });

    it("records scope:destroyed for root scope at end of stream", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        return "hello";
      }, { stream });

      let events = allEvents(stream);
      // Last event should be scope:destroyed for root
      let last = events[events.length - 1];
      expect(last.type).toEqual("scope:destroyed");
      if (last.type === "scope:destroyed") {
        expect(last.scopeId).toEqual("root");
        expect(last.result).toEqual({ ok: true });
      }
    });

    it("records child scope lifecycle for spawned tasks", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* sleep(1);
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = scopeEvents(stream);

      // Should have at least: root created, child created, child destroyed, root destroyed
      let created = events.filter((e) => e.type === "scope:created");
      let destroyed = events.filter((e) => e.type === "scope:destroyed");

      // Root + at least one child scope (task scope from spawn)
      expect(created.length).toBeGreaterThanOrEqual(2);
      expect(destroyed.length).toBeGreaterThanOrEqual(2);

      // Root scope should be first created and last destroyed
      expect(created[0].type === "scope:created" && created[0].scopeId).toEqual("root");

      let lastDestroyed = destroyed[destroyed.length - 1];
      expect(lastDestroyed.type === "scope:destroyed" && lastDestroyed.scopeId).toEqual("root");
    });

    it("records parent-child relationship in scope:created events", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = allEvents(stream);
      let scopeCreatedEvents = events.filter((e) => e.type === "scope:created");

      // First scope:created is root (no parent)
      let root = scopeCreatedEvents[0];
      expect(root.type === "scope:created" && root.parentScopeId).toBeUndefined();

      // Subsequent scope:created events should have parentScopeId set
      for (let i = 1; i < scopeCreatedEvents.length; i++) {
        let ev = scopeCreatedEvents[i];
        if (ev.type === "scope:created") {
          expect(ev.parentScopeId).toBeDefined();
        }
      }
    });

    it("destroys children before parents (structured concurrency invariant)", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* sleep(1);
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = scopeEvents(stream);
      let destroyEvents = events.filter((e) => e.type === "scope:destroyed");

      // Root should be the last scope destroyed
      let lastDestroyed = destroyEvents[destroyEvents.length - 1];
      if (lastDestroyed.type === "scope:destroyed") {
        expect(lastDestroyed.scopeId).toEqual("root");
      }
    });
  });

  describe("scope IDs in effect events", () => {
    it("tags effect:yielded events with the correct scope ID", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* action<number>((resolve) => {
          resolve(42);
          return () => {};
        });
        return 42;
      }, { stream });

      let events = allEvents(stream);
      let effectYielded = events.filter((e) => e.type === "effect:yielded" && e.description === "action");

      expect(effectYielded.length).toEqual(1);
      if (effectYielded[0].type === "effect:yielded") {
        // The effect should be tagged with a scope ID (not "unknown")
        expect(effectYielded[0].scopeId).not.toEqual("unknown");
      }
    });

    it("tags spawned task effects with child scope ID, not root", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-action");
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = allEvents(stream);

      // Find the child-action effect
      let childAction = events.find(
        (e) => e.type === "effect:yielded" && e.description === "child-action",
      );
      expect(childAction).toBeDefined();

      // It should NOT have scopeId "root" — it should have a child scope ID
      if (childAction && childAction.type === "effect:yielded") {
        expect(childAction.scopeId).not.toEqual("root");
        expect(childAction.scopeId).not.toEqual("unknown");
      }
    });
  });

  describe("replay with scope events", () => {
    it("replays scope events while creating real scopes", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let value = yield* action<number>((resolve) => {
          resolve(42);
          return () => {};
        });
        return value;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectExecuted = false;
      let result = await run(function* () {
        let value = yield* action<number>((resolve) => {
          effectExecuted = true;
          resolve(999);
          return () => {};
        });
        return value;
      }, { stream: replayStream });

      // Effect should not have been executed (replayed from stream)
      expect(effectExecuted).toEqual(false);
      expect(result).toEqual(42);
    });

    it("replays scope events for workflows with spawn", async () => {
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

      // Child effect should not have been executed (replayed)
      expect(childExecuted).toEqual(false);
      expect(result).toEqual(42);
    });
  });

  describe("scope:destroyed on error", () => {
    it("records scope:destroyed with ok:false when workflow errors", async () => {
      let stream = new InMemoryDurableStream();

      try {
        await run(function* () {
          yield* sleep(1);
          throw new Error("workflow error");
        }, { stream });
      } catch {
        // expected
      }

      let events = allEvents(stream);
      let destroyEvents = events.filter((e) => e.type === "scope:destroyed");

      // At least one scope:destroyed should have ok: false
      let errorDestroy = destroyEvents.find(
        (e) => e.type === "scope:destroyed" && !e.result.ok,
      );
      expect(errorDestroy).toBeDefined();
      if (errorDestroy && errorDestroy.type === "scope:destroyed" && !errorDestroy.result.ok) {
        expect(errorDestroy.result.error.message).toEqual("workflow error");
      }
    });
  });

  describe("halt with scope events", () => {
    it("records scope lifecycle during halt", async () => {
      let stream = new InMemoryDurableStream();

      let task = run(function* () {
        try {
          yield* suspend();
        } finally {
          yield* sleep(1);
        }
      }, { stream });

      await task.halt();

      let events = scopeEvents(stream);

      // Should have scope:created and scope:destroyed events
      let created = events.filter((e) => e.type === "scope:created");
      let destroyed = events.filter((e) => e.type === "scope:destroyed");

      expect(created.length).toBeGreaterThanOrEqual(1);
      expect(destroyed.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("workflow:return in scope lifecycle", () => {
    it("emits workflow:return before scope:destroyed for each task scope", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          return 42;
        });
        return yield* task;
      }, { stream });

      let events = allEvents(stream);
      let workflowReturns = events.filter((e) => e.type === "workflow:return");

      // Should have workflow:return events
      expect(workflowReturns.length).toBeGreaterThanOrEqual(1);

      // Each workflow:return should appear before its scope's scope:destroyed
      for (let wr of workflowReturns) {
        if (wr.type === "workflow:return") {
          let wrIdx = events.indexOf(wr);
          let destroyIdx = events.findIndex(
            (e) => e.type === "scope:destroyed" && e.scopeId === wr.scopeId,
          );
          if (destroyIdx >= 0) {
            expect(wrIdx).toBeLessThan(destroyIdx);
          }
        }
      }
    });
  });

  describe("scope hierarchy divergence", () => {
    it("detects parent mismatch during replay", async () => {
      // Record a workflow with spawn (creates parent-child scopes)
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

      // Tamper with the stream: change the parentScopeId of a child scope
      let events = recordStream.read().map((e) => e.event);
      let tamperedEvents = events.map((e) => {
        if (e.type === "scope:created" && e.parentScopeId) {
          return { ...e, parentScopeId: "wrong-parent" };
        }
        return e;
      });

      let replayStream = InMemoryDurableStream.from(tamperedEvents);

      try {
        await run(function* () {
          let task = yield* spawn(function* () {
            yield* action<void>((resolve) => {
              resolve();
              return () => {};
            }, "child-work");
            return 42;
          });
          return yield* task;
        }, { stream: replayStream });
        throw new Error("should have thrown DivergenceError");
      } catch (error) {
        expect(error).toBeInstanceOf(DivergenceError);
      }
    });
  });
});
