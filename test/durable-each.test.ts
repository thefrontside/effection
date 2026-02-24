import { action, each, run, sleep, spawn, type Operation, type Stream } from "../mod.ts";
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

  describe("loop body operations", () => {
    it("records loop-body effects with the caller scope's scopeId", async () => {
      let stream = new InMemoryDurableStream();

      let result: string[] = [];
      await run(function* () {
        let seq = asyncSequence("alpha", "beta", "gamma");
        for (let value of yield* each(seq)) {
          // This yield* runs in the CALLER scope, not the subscription child scope
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, `process-${value}`);
          result.push(value);
          yield* each.next();
        }
      }, { stream });

      expect(result).toEqual(["alpha", "beta", "gamma"]);

      let events = allEvents(stream);

      // Find the body effects (process-*)
      let bodyEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description.startsWith("process-"),
      );
      expect(bodyEffects.length).toEqual(3);
      expect(bodyEffects.map((e) => e.type === "effect:yielded" ? e.description : "")).toEqual([
        "process-alpha",
        "process-beta",
        "process-gamma",
      ]);

      // Find the stream-item effects (from asyncSequence)
      let streamEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description.startsWith("stream-item-"),
      );
      expect(streamEffects.length).toEqual(3);

      // Body effects must have the SAME scopeId as the stream-item effects
      // that come from each.next() (which runs in the caller scope).
      // The first stream-item-0 runs in the child scope, but stream-item-1+
      // run in the caller scope via each.next().
      let callerScopeStreamEffects = streamEffects.filter(
        (e) => e.type === "effect:yielded" && e.description !== "stream-item-0",
      );

      // All body effects should share the same scopeId
      let bodyScopes = bodyEffects.map((e) => e.type === "effect:yielded" ? e.scopeId : "");
      expect(new Set(bodyScopes).size).toEqual(1);

      // Body effects should be in the caller scope (same as each.next() stream effects)
      if (callerScopeStreamEffects.length > 0) {
        let callerScopeId = callerScopeStreamEffects[0].type === "effect:yielded"
          ? callerScopeStreamEffects[0].scopeId
          : "";
        expect(bodyScopes[0]).toEqual(callerScopeId);
      }

      // Verify interleaving order in the caller scope:
      // body effects should appear BEFORE their corresponding each.next() stream effects
      let callerScopeId = bodyScopes[0];
      let callerEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.scopeId === callerScopeId,
      );
      let callerDescs = callerEffects.map(
        (e) => e.type === "effect:yielded" ? e.description : "",
      );

      // For each iteration after the first, we expect: process-X, stream-item-N
      // The first iteration: process-alpha comes before stream-item-1
      let processIdx0 = callerDescs.indexOf("process-alpha");
      let streamIdx1 = callerDescs.indexOf("stream-item-1");
      expect(processIdx0).toBeLessThan(streamIdx1);

      let processIdx1 = callerDescs.indexOf("process-beta");
      let streamIdx2 = callerDescs.indexOf("stream-item-2");
      expect(processIdx1).toBeLessThan(streamIdx2);
    });

    it("replays loop-body effects without re-executing them", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      let recordedValues: string[] = [];
      await run(function* () {
        let seq = asyncSequence("alpha", "beta");
        for (let value of yield* each(seq)) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, `process-${value}`);
          recordedValues.push(value);
          yield* each.next();
        }
      }, { stream: recordStream });

      expect(recordedValues).toEqual(["alpha", "beta"]);

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let effectsEntered: string[] = [];
      let replayedValues: string[] = [];
      let initialEventCount = replayStream.length;

      await run(function* () {
        // Tracking stream — same descriptions, but tracks enter() calls
        let trackingSeq: Stream<string, void> = {
          *[Symbol.iterator]() {
            let items = ["alpha", "beta"].slice();
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

        for (let value of yield* each(trackingSeq)) {
          yield* action<void>((resolve) => {
            effectsEntered.push(`process-${value}`);
            resolve();
            return () => {};
          }, `process-${value}`);
          replayedValues.push(value);
          yield* each.next();
        }
      }, { stream: replayStream });

      // During full replay, NO effect.enter() should be called
      expect(effectsEntered).toEqual([]);

      // No new effect:yielded events should be appended
      let newEvents = replayStream.read(initialEventCount).map((e) => e.event);
      let newEffectYields = newEvents.filter((e) => e.type === "effect:yielded");
      expect(newEffectYields.length).toEqual(0);

      // Values should match recorded
      expect(replayedValues).toEqual(["alpha", "beta"]);
    });

    it("resumes mid-loop-body with each.next() executing live", async () => {
      // Step 1: Record full workflow
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let seq = asyncSequence("a", "b", "c");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, `process-${value}`);
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: recordStream });

      // Step 2: Truncate AFTER process-b but BEFORE stream-item-2 (each.next for "b")
      // This means: item "a" fully replayed, item "b"'s body effect replayed,
      // but each.next() for "b" must execute live.
      let events = recordStream.read().map((e) => e.event);
      let processBIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "process-b",
      );
      expect(processBIdx).toBeGreaterThan(0);

      // Find the resolution for process-b
      let processBEvent = events[processBIdx];
      let processBEffectId = processBEvent.type === "effect:yielded" ? processBEvent.effectId : "";
      let processBResolvedIdx = events.findIndex(
        (e) => e.type === "effect:resolved" && e.effectId === processBEffectId,
      );
      expect(processBResolvedIdx).toBeGreaterThan(processBIdx);

      // Truncate after process-b's resolution (include body effect + resolution)
      let partialStream = InMemoryDurableStream.from(
        events.slice(0, processBResolvedIdx + 1),
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
                  let idx = index;
                  let desc = `stream-item-${index++}`;
                  let result = yield* action<string>((resolve) => {
                    liveExecutions.push(`stream-item-${idx}`);
                    resolve(value);
                    return () => {};
                  }, desc);
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
          yield* action<void>((resolve) => {
            liveExecutions.push(`process-${value}`);
            resolve();
            return () => {};
          }, `process-${value}`);
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: partialStream });

      // process-a and process-b should NOT have been live-executed (replayed)
      expect(liveExecutions).not.toContain("process-a");
      expect(liveExecutions).not.toContain("process-b");

      // stream-item-0 (child scope, first next) and stream-item-1 (each.next for "a")
      // should have been replayed. stream-item-2 (each.next for "b") should be live.
      expect(liveExecutions).not.toContain("stream-item-0");
      expect(liveExecutions).not.toContain("stream-item-1");
      expect(liveExecutions).toContain("stream-item-2");

      // process-c and stream-item for "c" should be live
      expect(liveExecutions).toContain("process-c");

      // Final result should be complete
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("resumes between iterations with next body effect executing live", async () => {
      // Step 1: Record full workflow
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let seq = asyncSequence("a", "b", "c");
        let collected: string[] = [];
        for (let value of yield* each(seq)) {
          yield* action<void>((resolve) => {
            resolve();
            return () => {};
          }, `process-${value}`);
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: recordStream });

      // Step 2: Truncate AFTER each.next() for "a" (stream-item-1 + resolution)
      // but BEFORE process-b. This is "between iterations".
      let events = recordStream.read().map((e) => e.event);

      // Find stream-item-1 (the each.next() call that delivers "b")
      let streamItem1Idx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "stream-item-1",
      );
      expect(streamItem1Idx).toBeGreaterThan(0);

      // Find its resolution
      let streamItem1Event = events[streamItem1Idx];
      let streamItem1EffectId = streamItem1Event.type === "effect:yielded" ? streamItem1Event.effectId : "";
      let streamItem1ResolvedIdx = events.findIndex(
        (e) => e.type === "effect:resolved" && e.effectId === streamItem1EffectId,
      );
      expect(streamItem1ResolvedIdx).toBeGreaterThan(streamItem1Idx);

      // Truncate after stream-item-1's resolution
      let partialStream = InMemoryDurableStream.from(
        events.slice(0, streamItem1ResolvedIdx + 1),
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
                  let idx = index;
                  let desc = `stream-item-${index++}`;
                  let result = yield* action<string>((resolve) => {
                    liveExecutions.push(`stream-item-${idx}`);
                    resolve(value);
                    return () => {};
                  }, desc);
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
          yield* action<void>((resolve) => {
            liveExecutions.push(`process-${value}`);
            resolve();
            return () => {};
          }, `process-${value}`);
          collected.push(value);
          yield* each.next();
        }
        return collected;
      }, { stream: partialStream });

      // Item "a": process-a and stream-item-0 and stream-item-1 all replayed
      expect(liveExecutions).not.toContain("process-a");
      expect(liveExecutions).not.toContain("stream-item-0");
      expect(liveExecutions).not.toContain("stream-item-1");

      // Item "b": body effect should be live (we truncated before process-b)
      expect(liveExecutions).toContain("process-b");

      // Item "c": everything live
      expect(liveExecutions).toContain("process-c");

      // Final result should be complete
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("records spawned child scopes from loop body under caller scope", async () => {
      let stream = new InMemoryDurableStream();

      let result: string[] = [];
      await run(function* () {
        let seq = asyncSequence("x", "y");
        for (let value of yield* each(seq)) {
          // Spawn inside the loop body — the spawned scope should be
          // a child of the CALLER scope (the scope running the for loop),
          // not a child of the subscription scope.
          let task = yield* spawn(function* () {
            yield* sleep(0);
            return `spawned-${value}`;
          });
          let spawned = yield* task;
          result.push(spawned);
          yield* each.next();
        }
      }, { stream });

      expect(result).toEqual(["spawned-x", "spawned-y"]);

      let events = allEvents(stream);

      // Find all scope:created events (excluding root)
      let scopeCreations = events.filter(
        (e) => e.type === "scope:created" && e.scopeId !== "root",
      ) as Array<{ type: "scope:created"; scopeId: string; parentScopeId?: string }>;

      // Scope hierarchy:
      // root
      //   scope-1 (task scope from scope.run(operation) — this is the "caller")
      //     scope-2 (subscription scope from each())
      //     scope-3 (spawned scope for "x" from loop body)
      //     scope-4 (spawned scope for "y" from loop body)
      //
      // The task scope (scope-1) is the first non-root scope
      let taskScope = scopeCreations[0];
      expect(taskScope.parentScopeId).toEqual("root");
      let callerScopeId = taskScope.scopeId;

      // All remaining scopes (subscription + spawned) should be children
      // of the caller scope (task scope)
      let childScopes = scopeCreations.slice(1);
      expect(childScopes.length).toBeGreaterThanOrEqual(3);

      for (let scope of childScopes) {
        expect(scope.parentScopeId).toEqual(callerScopeId);
      }

      // Specifically verify the spawned scopes share the same parent
      // as the subscription scope (they're siblings, not children of subscription)
      let subscriptionScope = childScopes[0];
      let spawnedScopes = childScopes.slice(1);
      expect(spawnedScopes.length).toEqual(2);
      for (let scope of spawnedScopes) {
        expect(scope.parentScopeId).toEqual(subscriptionScope.parentScopeId);
      }

      // Verify replay works correctly with these nested scopes
      let replayStream = InMemoryDurableStream.from(
        recordedEvents(stream),
      );

      let effectsEntered: string[] = [];
      let replayResult: string[] = [];

      await run(function* () {
        let trackingSeq: Stream<string, void> = {
          *[Symbol.iterator]() {
            let items = ["x", "y"].slice();
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

        for (let value of yield* each(trackingSeq)) {
          let task = yield* spawn(function* () {
            yield* action<void>((resolve) => {
              effectsEntered.push(`sleep-${value}`);
              resolve();
              return () => {};
            }, "sleep(0)");
            return `spawned-${value}`;
          });
          let spawned = yield* task;
          replayResult.push(spawned);
          yield* each.next();
        }
      }, { stream: replayStream });

      // No effects should have been entered during replay
      expect(effectsEntered).toEqual([]);
      expect(replayResult).toEqual(["spawned-x", "spawned-y"]);
    });
  });
});

/**
 * Helper: extract events from stream for replay.
 */
function recordedEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}
