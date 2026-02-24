import { action, each, run, spawn, type Operation, type Stream } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

/**
 * Create a stream that delivers values via action effects.
 * Each subscription.next() yields an action with a trackable description,
 * making the effects visible in the durable stream for testing.
 */
function asyncSequence(
  ...values: string[]
): Stream<string, void> {
  return {
    *[Symbol.iterator]() {
      let items = values.slice();
      let index = 0;
      return {
        *next(): Operation<IteratorResult<string, void>> {
          let value = items.shift();
          if (typeof value !== "undefined") {
            // Use an action with a trackable description so we can
            // see it in the durable stream.
            let result = yield* action<string>((resolve) => {
              resolve(value);
              return () => {};
            }, `stream-item-${index++}`);
            return { done: false, value: result };
          } else {
            return { done: true, value: undefined };
          }
        },
      };
    },
  };
}

/**
 * Synchronous stream — no action effects, values returned directly.
 */
function syncSequence(...values: string[]): Stream<string, void> {
  return {
    *[Symbol.iterator]() {
      let items = values.slice();
      return {
        *next(): Operation<IteratorResult<string, void>> {
          let value = items.shift();
          if (typeof value !== "undefined") {
            return { done: false, value };
          } else {
            return { done: true, value: undefined };
          }
        },
      };
    },
  };
}

describe("durable each", () => {
  describe("recording", () => {
    it("records events for each() over an async stream", async () => {
      let stream = new InMemoryDurableStream();

      let result: string[] = [];
      await run(function* () {
        let seq = asyncSequence("alpha", "beta", "gamma");
        for (let value of yield* each(seq)) {
          result.push(value);
          yield* each.next();
        }
      }, { stream });

      expect(result).toEqual(["alpha", "beta", "gamma"]);

      // Verify stream-item effects were recorded
      let events = allEvents(stream);
      let streamItems = events.filter(
        (e) => e.type === "effect:yielded" && e.description.startsWith("stream-item-"),
      );
      // 3 items: stream-item-0 (first next in spawned child scope),
      // stream-item-1, stream-item-2 (from each.next in caller scope).
      // The terminal next() returns { done: true } without yielding an action.
      expect(streamItems.length).toEqual(3);

      // Verify resolutions contain the values
      let resolutions = events.filter((e) => e.type === "effect:resolved");
      let itemResolutions = resolutions.filter((r) => {
        let yielded = streamItems.find(
          (y) => y.type === "effect:yielded" && r.type === "effect:resolved" && y.effectId === r.effectId,
        );
        return !!yielded;
      });
      expect(itemResolutions.length).toBeGreaterThanOrEqual(3);
    });

    it("records events for each() over a synchronous stream", async () => {
      let stream = new InMemoryDurableStream();

      let result: string[] = [];
      await run(function* () {
        let seq = syncSequence("one", "two");
        for (let value of yield* each(seq)) {
          result.push(value);
          yield* each.next();
        }
      }, { stream });

      expect(result).toEqual(["one", "two"]);

      // Synchronous streams produce no user-facing action effects,
      // so the stream should only contain scope lifecycle events.
      let events = allEvents(stream);
      let userEffects = events.filter(
        (e) => e.type === "effect:yielded",
      );
      expect(userEffects.length).toEqual(0);
    });
  });

  describe("replay", () => {
    it("replays each() without re-executing effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      let recordedValues: string[] = [];
      await run(function* () {
        let seq = asyncSequence("alpha", "beta", "gamma");
        for (let value of yield* each(seq)) {
          recordedValues.push(value);
          yield* each.next();
        }
      }, { stream: recordStream });

      expect(recordedValues).toEqual(["alpha", "beta", "gamma"]);

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayedValues: string[] = [];

      // Create a stream that tracks whether effect.enter() is called
      // Note: generator delegation (yield* stream) still runs during replay —
      // only effect.enter() is suppressed by the durable reducer.
      let trackingStream: Stream<string, void> = {
        *[Symbol.iterator]() {
          let items = ["alpha", "beta", "gamma"].slice();
          let index = 0;
          return {
            *next(): Operation<IteratorResult<string, void>> {
              let value = items.shift();
              if (typeof value !== "undefined") {
                let result = yield* action<string>((resolve) => {
                  effectsEntered.push(`stream-item-${index}`);
                  resolve(value);
                  return () => {};
                }, `stream-item-${index++}`);
                return { done: false, value: result };
              } else {
                return { done: true, value: undefined };
              }
            },
          };
        },
      };

      let initialEventCount = replayStream.length;

      await run(function* () {
        for (let value of yield* each(trackingStream)) {
          replayedValues.push(value);
          yield* each.next();
        }
      }, { stream: replayStream });

      // During full replay, effect.enter() should not be called —
      // the durable reducer feeds stored results back to generators.
      expect(effectsEntered).toEqual([]);
      // No new effect:yielded events should be appended during replay
      let newEvents = replayStream.read(initialEventCount).map((e) => e.event);
      let newEffectYields = newEvents.filter((e) => e.type === "effect:yielded");
      expect(newEffectYields.length).toEqual(0);
      // Values should match what was recorded
      expect(replayedValues).toEqual(["alpha", "beta", "gamma"]);
    });

    it("replays each() and produces the same collected values", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let seq = asyncSequence("x", "y", "z");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        // Use the collected values in a subsequent action so we can
        // verify the return value
        return collected;
      }, { stream: recordStream });

      // Step 2: Replay with same effect descriptions but different resolve values.
      // The durable reducer should return stored results, not call effect.enter(),
      // so the "WRONG" values should never appear.
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let result = await run(function* () {
        // Provide a stream with DIFFERENT values — during replay
        // effect.enter() is not called, so the resolve(value) with
        // WRONG values never fires.
        let seq: Stream<string, void> = {
          *[Symbol.iterator]() {
            let items = ["WRONG1", "WRONG2", "WRONG3"].slice();
            let index = 0;
            return {
              *next(): Operation<IteratorResult<string, void>> {
                let value = items.shift();
                if (typeof value !== "undefined") {
                  let result = yield* action<string>((resolve) => {
                    effectsEntered.push(value);
                    resolve(value);
                    return () => {};
                  }, `stream-item-${index++}`);
                  return { done: false, value: result };
                } else {
                  return { done: true, value: undefined };
                }
              },
            };
          },
        };

        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: replayStream });

      // effect.enter() should not be called during replay
      expect(effectsEntered).toEqual([]);
      // Values should come from the recorded stream, not the WRONG values
      expect(result).toEqual(["x", "y", "z"]);
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes mid-stream with subsequent items executing live", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let seq = asyncSequence("a", "b", "c");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: recordStream });

      // Step 2: Truncate after the second item's effect
      // Find the "stream-item-2" effect (third item "c")
      let events = recordStream.read().map((e) => e.event);
      let thirdItemIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "stream-item-2",
      );
      expect(thirdItemIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, thirdItemIdx),
      );

      // Step 3: Resume
      let liveExecutions: string[] = [];
      let result = await run(function* () {
        let seq: Stream<string, void> = {
          *[Symbol.iterator]() {
            let items = ["a", "b", "c"].slice();
            let index = 0;
            return {
              *next(): Operation<IteratorResult<string, void>> {
                let value = items.shift();
                if (typeof value !== "undefined") {
                  let result = yield* action<string>((resolve) => {
                    liveExecutions.push(value);
                    resolve(value);
                    return () => {};
                  }, `stream-item-${index++}`);
                  return { done: false, value: result };
                } else {
                  return { done: true, value: undefined };
                }
              },
            };
          },
        };

        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: partialStream });

      // First two items should have been replayed (not live-executed)
      // Third item and terminal next should have executed live
      expect(liveExecutions).toContain("c");
      expect(liveExecutions).not.toContain("a");
      expect(liveExecutions).not.toContain("b");
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("resumes after each() completes with subsequent live effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let seq = asyncSequence("hello", "world");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        let extra = yield* action<string>((resolve) => {
          resolve("after-each");
          return () => {};
        }, "post-each-action");
        return [...collected, extra];
      }, { stream: recordStream });

      // Step 2: Truncate before "post-each-action"
      let events = recordStream.read().map((e) => e.event);
      let postIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "post-each-action",
      );
      expect(postIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, postIdx),
      );

      // Step 3: Resume
      let postEachExecuted = false;
      let result = await run(function* () {
        let seq = asyncSequence("hello", "world");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        let extra = yield* action<string>((resolve) => {
          postEachExecuted = true;
          resolve("after-each");
          return () => {};
        }, "post-each-action");
        return [...collected, extra];
      }, { stream: partialStream });

      expect(postEachExecuted).toEqual(true);
      expect(result).toEqual(["hello", "world", "after-each"]);
    });
  });

  describe("synchronous streams", () => {
    it("records and replays each() with a synchronous stream", async () => {
      // Synchronous streams have no user-facing effects, so
      // recording and replay should both work — the workflow
      // just executes the same way each time.
      let recordStream = new InMemoryDurableStream();

      let result = await run(function* () {
        let seq = syncSequence("one", "two", "three");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: recordStream });

      expect(result).toEqual(["one", "two", "three"]);

      // Replay should produce the same result
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let replayResult = await run(function* () {
        let seq = syncSequence("one", "two", "three");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: replayStream });

      expect(replayResult).toEqual(["one", "two", "three"]);
    });
  });
});
