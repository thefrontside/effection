import { action, ensure, resource, run, sleep, spawn, suspend } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import { DivergenceError } from "../lib/durable/types.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

/**
 * Helper: extract user-facing effect events (not infrastructure).
 */
function userEffects(stream: InMemoryDurableStream): DurableEvent[] {
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
      return true;
    });
}

describe("durable resource", () => {
  describe("basic resource recording", () => {
    it("records events for a simple resource that provides a value", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        let value = yield* resource(function* (provide) {
          yield* provide(42);
        });
        return value;
      }, { stream });

      expect(result).toEqual(42);

      // Check that events were recorded
      let events = allEvents(stream);
      expect(events.length).toBeGreaterThan(0);

      // Should have scope lifecycle events
      let scopeCreated = events.filter((e) => e.type === "scope:created");
      let scopeDestroyed = events.filter((e) => e.type === "scope:destroyed");
      expect(scopeCreated.length).toBeGreaterThanOrEqual(1);
      expect(scopeDestroyed.length).toBeGreaterThanOrEqual(1);
    });

    it("records events for a resource with effects before provide", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        let value = yield* resource(function* (provide) {
          let x = yield* action<number>((resolve) => {
            resolve(10);
            return () => {};
          }, "resource-init");
          yield* provide(x * 2);
        });
        return value;
      }, { stream });

      expect(result).toEqual(20);

      // The resource-init action should be in the stream
      let events = allEvents(stream);
      let resourceInit = events.find(
        (e) => e.type === "effect:yielded" && e.description === "resource-init",
      );
      expect(resourceInit).toBeDefined();
    });

    it("records events for a resource with cleanup in finally", async () => {
      let stream = new InMemoryDurableStream();
      let cleanedUp = false;

      await run(function* () {
        yield* resource(function* (provide) {
          try {
            yield* provide(42);
          } finally {
            cleanedUp = true;
          }
        });
      }, { stream });

      expect(cleanedUp).toEqual(true);
    });
  });

  describe("resource replay", () => {
    it("replays a simple resource without re-executing the init", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let value = yield* resource(function* (provide) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "resource-setup");
          yield* provide(42);
        });
        return value;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let setupExecuted = false;
      let result = await run(function* () {
        let value = yield* resource(function* (provide) {
          yield* action<void>((resolve) => {
            setupExecuted = true;
            resolve();
            return () => {};
          }, "resource-setup");
          yield* provide(42);
        });
        return value;
      }, { stream: replayStream });

      expect(setupExecuted).toEqual(false);
      expect(result).toEqual(42);
    });

    it("replays a resource followed by other effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let conn = yield* resource<number>(function* (provide) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "connect");
          yield* provide(10);
        });
        let extra = yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        }, "after-resource");
        return conn + extra;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let connectExecuted = false;
      let afterResourceExecuted = false;
      let result = await run(function* () {
        let conn = yield* resource<number>(function* (provide) {
          yield* action<void>((resolve) => {
            connectExecuted = true;
            resolve();
            return () => {};
          }, "connect");
          yield* provide(10);
        });
        let extra = yield* action<number>((resolve) => {
          afterResourceExecuted = true;
          resolve(20);
          return () => {};
        }, "after-resource");
        return conn + extra;
      }, { stream: replayStream });

      expect(connectExecuted).toEqual(false);
      expect(afterResourceExecuted).toEqual(false);
      expect(result).toEqual(30);
    });
  });

  describe("resource mid-workflow resume", () => {
    it("resumes after resource init replayed, continues with live effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let conn = yield* resource<number>(function* (provide) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "connect");
          yield* provide(10);
        });
        let extra = yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        }, "after-resource");
        return conn + extra;
      }, { stream: recordStream });

      // Step 2: Truncate stream just before "after-resource"
      let events = recordStream.read().map((e) => e.event);
      let cutIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "after-resource",
      );
      expect(cutIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(events.slice(0, cutIdx));

      // Step 3: Resume
      let connectExecuted = false;
      let afterResourceExecuted = false;
      let result = await run(function* () {
        let conn = yield* resource<number>(function* (provide) {
          yield* action<void>((resolve) => {
            connectExecuted = true;
            resolve();
            return () => {};
          }, "connect");
          yield* provide(10);
        });
        let extra = yield* action<number>((resolve) => {
          afterResourceExecuted = true;
          resolve(20);
          return () => {};
        }, "after-resource");
        return conn + extra;
      }, { stream: partialStream });

      // Resource init should be replayed
      expect(connectExecuted).toEqual(false);
      // After-resource should execute live
      expect(afterResourceExecuted).toEqual(true);
      expect(result).toEqual(30);
    });
  });
});

describe("durable ensure", () => {
  describe("ensure recording", () => {
    it("records events for ensure and runs cleanup", async () => {
      let stream = new InMemoryDurableStream();
      let cleanedUp = false;

      await run(function* () {
        yield* ensure(() => {
          cleanedUp = true;
        });
        yield* sleep(1);
        return "done";
      }, { stream });

      expect(cleanedUp).toEqual(true);

      // Should have events in the stream
      let events = allEvents(stream);
      expect(events.length).toBeGreaterThan(0);
    });

    it("ensure cleanup runs even during replay", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* ensure(() => {
          // no-op during recording
        });
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "work");
        return "done";
      }, { stream: recordStream });

      // Step 2: Replay — cleanup should still run
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let cleanedUp = false;
      let result = await run(function* () {
        yield* ensure(() => {
          cleanedUp = true;
        });
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "work");
        return "done";
      }, { stream: replayStream });

      // Cleanup should run during replay (it's a live side-effect)
      expect(cleanedUp).toEqual(true);
      expect(result).toEqual("done");
    });
  });

  describe("ensure with async cleanup", () => {
    it("records events for ensure with operation cleanup", async () => {
      let stream = new InMemoryDurableStream();
      let cleanedUp = false;

      await run(function* () {
        yield* ensure(function* () {
          yield* sleep(1);
          cleanedUp = true;
        });
        yield* sleep(1);
        return "done";
      }, { stream });

      expect(cleanedUp).toEqual(true);
    });
  });
});

describe("durable resource + spawn", () => {
  it("records events for a spawned task that uses a resource", async () => {
    let stream = new InMemoryDurableStream();

    let result = await run(function* () {
      let task = yield* spawn(function* () {
        let value = yield* resource(function* (provide) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-resource-init");
          yield* provide(42);
        });
        return value;
      });
      return yield* task;
    }, { stream });

    expect(result).toEqual(42);
  });

  it("replays a spawned resource without re-executing", async () => {
    // Step 1: Record
    let recordStream = new InMemoryDurableStream();

    await run(function* () {
      let task = yield* spawn(function* () {
        let value = yield* resource(function* (provide) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-resource-init");
          yield* provide(42);
        });
        return value;
      });
      return yield* task;
    }, { stream: recordStream });

    // Step 2: Replay
    let replayStream = InMemoryDurableStream.from(
      recordStream.read().map((e) => e.event),
    );

    let initExecuted = false;
    let result = await run(function* () {
      let task = yield* spawn(function* () {
        let value = yield* resource(function* (provide) {
          yield* action<void>((resolve) => {
            initExecuted = true;
            resolve();
            return () => {};
          }, "child-resource-init");
          yield* provide(42);
        });
        return value;
      });
      return yield* task;
    }, { stream: replayStream });

    expect(initExecuted).toEqual(false);
    expect(result).toEqual(42);
  });
});
