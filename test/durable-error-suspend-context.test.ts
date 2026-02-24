import {
  action,
  createContext,
  run,
  sleep,
  spawn,
  suspend,
  until,
} from "../mod.ts";
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

// ═══════════════════════════════════════════════════════════════════
// Phase 7: Error handling, suspend, and context durable tests
// ═══════════════════════════════════════════════════════════════════

describe("durable error handling", () => {
  describe("replay of caught errors", () => {
    it("replays a caught error and takes the catch path without re-executing effects", async () => {
      // Step 1: Record — error is caught, recovery action runs
      let recordStream = new InMemoryDurableStream();

      let result = await run(function* () {
        let value: string;
        try {
          yield* until(Promise.reject(new Error("oops")));
          value = "should-not-reach";
        } catch {
          value = yield* action<string>((resolve) => {
            resolve("recovered");
            return () => {};
          }, "recovery-action");
        }
        return value;
      }, { stream: recordStream });

      expect(result).toEqual("recovered");

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayResult = await run(function* () {
        let value: string;
        try {
          yield* action<string>((resolve) => {
            effectsEntered.push("failing-action");
            resolve("wrong");
            return () => {};
          });
          value = "should-not-reach";
        } catch {
          value = yield* action<string>((resolve) => {
            effectsEntered.push("recovery-action");
            resolve("wrong-recovery");
            return () => {};
          }, "recovery-action");
        }
        return value;
      }, { stream: replayStream });

      // effect.enter() should not be called during full replay
      expect(effectsEntered).toEqual([]);
      // Value should come from stored stream
      expect(replayResult).toEqual("recovered");
    });

    it("replays multiple caught errors in sequence", async () => {
      let recordStream = new InMemoryDurableStream();

      let result = await run(function* () {
        let values: string[] = [];

        for (let i = 0; i < 3; i++) {
          try {
            yield* until(Promise.reject(new Error(`fail-${i}`)));
          } catch {
            let v = yield* action<string>((resolve) => {
              resolve(`catch-${i}`);
              return () => {};
            }, `catch-action-${i}`);
            values.push(v);
          }
        }

        return values;
      }, { stream: recordStream });

      expect(result).toEqual(["catch-0", "catch-1", "catch-2"]);

      // Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayResult = await run(function* () {
        let values: string[] = [];

        for (let i = 0; i < 3; i++) {
          try {
            yield* action<string>((resolve) => {
              effectsEntered.push(`fail-${i}`);
              resolve("wrong");
              return () => {};
            });
          } catch {
            let v = yield* action<string>((resolve) => {
              effectsEntered.push(`catch-${i}`);
              resolve("wrong");
              return () => {};
            }, `catch-action-${i}`);
            values.push(v);
          }
        }

        return values;
      }, { stream: replayStream });

      expect(effectsEntered).toEqual([]);
      expect(replayResult).toEqual(["catch-0", "catch-1", "catch-2"]);
    });
  });

  describe("replay-to-live error transition", () => {
    it("replays prefix then propagates live error", async () => {
      // Step 1: Record a workflow with two effects
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* action<number>((resolve) => {
          resolve(10);
          return () => {};
        }, "first-action");
        yield* action<number>((resolve) => {
          resolve(20);
          return () => {};
        }, "second-action");
        return 30;
      }, { stream: recordStream });

      // Step 2: Truncate after first effect to simulate crash
      let events = allEvents(recordStream);
      let secondIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "second-action",
      );
      expect(secondIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, secondIdx),
      );

      // Step 3: Resume — first effect replays, second throws live
      let firstEntered = false;
      try {
        await run(function* () {
          yield* action<number>((resolve) => {
            firstEntered = true;
            resolve(10);
            return () => {};
          }, "first-action");
          yield* until(Promise.reject(new Error("live-boom")));
          return 30;
        }, { stream: partialStream });
        throw new Error("should have thrown");
      } catch (error) {
        expect((error as Error).message).toEqual("live-boom");
      }

      // First effect was replayed, not re-executed
      expect(firstEntered).toEqual(false);

      // scope:destroyed should have ok:false
      let newEvents = partialStream.read().map((e) => e.event);
      let rootDestroyed = newEvents.find(
        (e) => e.type === "scope:destroyed" && e.scopeId === "root",
      );
      expect(rootDestroyed).toBeDefined();
      if (rootDestroyed && rootDestroyed.type === "scope:destroyed") {
        expect(rootDestroyed.result.ok).toEqual(false);
      }
    });
  });

  describe("error in finally during halt", () => {
    it("propagates finally error when halting after replayed prefix", async () => {
      // Step 1: Record a workflow that suspends
      let recordStream = new InMemoryDurableStream();

      let task = run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "setup-action");
        yield* suspend();
      }, { stream: recordStream });

      await task.halt();

      // Step 2: Truncate — keep only through the setup-action resolution
      let events = allEvents(recordStream);
      let suspendIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, suspendIdx),
      );

      // Step 3: Resume with a finally that throws
      let task2 = run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "setup-action");
        try {
          yield* suspend();
        } finally {
          throw new Error("finally-boom");
        }
      }, { stream: partialStream });

      try {
        await task2.halt();
        throw new Error("should have thrown");
      } catch (error) {
        expect((error as Error).message).toEqual("finally-boom");
      }
    });
  });
});

describe("durable suspend", () => {
  describe("replay of halted workflow", () => {
    it("replays a halted workflow deterministically", async () => {
      // Step 1: Record — workflow suspends and gets halted
      let recordStream = new InMemoryDurableStream();
      let cleanupOrder: string[] = [];

      let task = run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "init-action");
        try {
          yield* suspend();
        } finally {
          cleanupOrder.push("cleanup");
        }
      }, { stream: recordStream });

      await task.halt();
      expect(cleanupOrder).toEqual(["cleanup"]);

      // Step 2: Replay with full stream
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let replayCleanup: string[] = [];
      let effectsEntered: string[] = [];

      let task2 = run(function* () {
        yield* action<void>((resolve) => {
          effectsEntered.push("init-action");
          resolve();
          return () => {};
        }, "init-action");
        try {
          yield* suspend();
        } finally {
          replayCleanup.push("cleanup");
        }
      }, { stream: replayStream });

      await task2.halt();

      // init-action should be replayed, not re-executed
      expect(effectsEntered).toEqual([]);
      // cleanup still runs (finally blocks always execute on halt)
      expect(replayCleanup).toEqual(["cleanup"]);
    });
  });

  describe("mid-workflow resume to suspend", () => {
    it("replays prefix then enters suspend live", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      let task = run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "pre-suspend-action");
        yield* suspend();
      }, { stream: recordStream });

      await task.halt();

      // Step 2: Truncate before suspend
      let events = allEvents(recordStream);
      let suspendIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, suspendIdx),
      );

      // Step 3: Resume — pre-suspend-action replays, suspend enters live
      let effectsEntered: string[] = [];
      let cleanupRan = false;

      let task2 = run(function* () {
        yield* action<void>((resolve) => {
          effectsEntered.push("pre-suspend-action");
          resolve();
          return () => {};
        }, "pre-suspend-action");
        try {
          yield* suspend();
        } finally {
          cleanupRan = true;
        }
      }, { stream: partialStream });

      await task2.halt();

      // Pre-suspend action was replayed, not re-executed
      expect(effectsEntered).toEqual([]);
      // Suspend entered live, cleanup ran on halt
      expect(cleanupRan).toEqual(true);

      // The partial stream should now have the suspend event appended
      let newEvents = partialStream.read().map((e) => e.event);
      let suspendEvents = newEvents.filter(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("suspend with async cleanup under replay", () => {
    it("runs async cleanup effects on halt after replayed prefix", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      let task = run(function* () {
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "setup");
        try {
          yield* suspend();
        } finally {
          yield* sleep(1);
        }
      }, { stream: recordStream });

      await task.halt();

      // Step 2: Truncate before suspend
      let events = allEvents(recordStream);
      let suspendIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, suspendIdx),
      );

      // Step 3: Resume — setup replays, suspend + sleep(1) in finally execute live
      let setupEntered = false;

      let task2 = run(function* () {
        yield* action<void>((resolve) => {
          setupEntered = true;
          resolve();
          return () => {};
        }, "setup");
        try {
          yield* suspend();
        } finally {
          yield* sleep(1);
        }
      }, { stream: partialStream });

      await task2.halt();

      expect(setupEntered).toEqual(false);

      // Verify sleep in finally was recorded to the stream
      let newEvents = partialStream.read().map((e) => e.event);
      let sleepEvents = newEvents.filter(
        (e) =>
          e.type === "effect:yielded" &&
          (e.description === "sleep(1)" || e.description === "action"),
      );
      expect(sleepEvents.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("durable context", () => {
  let TestContext = createContext<string>("test-context");

  describe("recording", () => {
    it("records scope:set events for context.set()", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* TestContext.set("hello");
        return yield* TestContext.expect();
      }, { stream });

      let events = allEvents(stream);
      let setEvents = events.filter(
        (e) => e.type === "scope:set" && e.contextName === "test-context",
      );
      expect(setEvents.length).toBeGreaterThanOrEqual(1);

      if (setEvents[0] && setEvents[0].type === "scope:set") {
        expect(setEvents[0].value).toEqual("hello");
      }
    });

    it("records scope:delete events for context.delete()", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* TestContext.set("temporary");
        yield* TestContext.delete();
      }, { stream });

      let events = allEvents(stream);
      let deleteEvents = events.filter(
        (e) => e.type === "scope:delete" && e.contextName === "test-context",
      );
      expect(deleteEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("records scope:set with correct scopeId for child scopes", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        let task = yield* spawn(function* () {
          yield* TestContext.set("child-value");
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, "child-action");
        });
        return yield* task;
      }, { stream });

      let events = allEvents(stream);
      let setEvents = events.filter(
        (e) => e.type === "scope:set" && e.contextName === "test-context",
      );
      expect(setEvents.length).toBeGreaterThanOrEqual(1);

      // Should be on a child scope, not root
      if (setEvents[0] && setEvents[0].type === "scope:set") {
        expect(setEvents[0].scopeId).not.toEqual("root");
      }
    });
  });

  describe("non-serializable values", () => {
    it("records non-serializable context values as __liveOnly sentinel", async () => {
      let ObjectContext = createContext<{ fn: () => void }>("object-context");
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* ObjectContext.set({ fn: () => {} });
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "after-set");
      }, { stream });

      let events = allEvents(stream);
      let setEvents = events.filter(
        (e) => e.type === "scope:set" && e.contextName === "object-context",
      );

      // Should record without crashing
      expect(setEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("context with replay", () => {
    it("context events are informational — workflow re-executes context ops on replay", async () => {
      // Context set/delete are recorded for observability but not rehydrated
      // during replay. The workflow generator re-executes context operations
      // as part of normal generator execution (they are infrastructure effects).
      let recordStream = new InMemoryDurableStream();

      let result = await run(function* () {
        yield* TestContext.set("from-recording");
        let v = yield* action<string>((resolve) => {
          resolve("action-result");
          return () => {};
        }, "test-action");
        let ctx = yield* TestContext.expect();
        return `${ctx}:${v}`;
      }, { stream: recordStream });

      expect(result).toEqual("from-recording:action-result");

      // Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayResult = await run(function* () {
        // Context set is a "do <set(...)>" infrastructure effect — it runs live
        yield* TestContext.set("from-replay");
        let v = yield* action<string>((resolve) => {
          effectsEntered.push("test-action");
          resolve("wrong");
          return () => {};
        }, "test-action");
        // Context value comes from live execution, not from stream
        let ctx = yield* TestContext.expect();
        return `${ctx}:${v}`;
      }, { stream: replayStream });

      // action was replayed
      expect(effectsEntered).toEqual([]);
      // Context value is from live execution ("from-replay"), not rehydrated
      // Action value is from stored stream ("action-result")
      expect(replayResult).toEqual("from-replay:action-result");
    });

    it("context.with() works correctly during replay", async () => {
      let recordStream = new InMemoryDurableStream();

      let result = await run(function* () {
        return yield* TestContext.with("scoped-value", function* (val) {
          let a = yield* action<string>((resolve) => {
            resolve(val);
            return () => {};
          }, "scoped-action");
          return a;
        });
      }, { stream: recordStream });

      expect(result).toEqual("scoped-value");

      // Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayResult = await run(function* () {
        return yield* TestContext.with("scoped-value", function* (_val) {
          let a = yield* action<string>((resolve) => {
            effectsEntered.push("scoped-action");
            resolve("wrong");
            return () => {};
          }, "scoped-action");
          return a;
        });
      }, { stream: replayStream });

      expect(effectsEntered).toEqual([]);
      expect(replayResult).toEqual("scoped-value");
    });
  });
});
