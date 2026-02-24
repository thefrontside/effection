import { action, all, race, run, sleep, spawn } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

describe("durable all", () => {
  describe("recording", () => {
    it("records events for all() with multiple operations", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        return yield* all([
          action<number>((resolve) => {
            resolve(1);
            return () => {};
          }, "task-a"),
          action<number>((resolve) => {
            resolve(2);
            return () => {};
          }, "task-b"),
        ]);
      }, { stream });

      expect(result).toEqual([1, 2]);

      // Both tasks' effects should be in the stream
      let events = allEvents(stream);
      let taskA = events.find(
        (e) => e.type === "effect:yielded" && e.description === "task-a",
      );
      let taskB = events.find(
        (e) => e.type === "effect:yielded" && e.description === "task-b",
      );
      expect(taskA).toBeDefined();
      expect(taskB).toBeDefined();
    });

    it("records events for all() with sleep operations", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        yield* all([sleep(1), sleep(1)]);
        return "done";
      }, { stream });

      expect(result).toEqual("done");
    });
  });

  describe("replay", () => {
    it("replays all() without re-executing child effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        return yield* all([
          action<number>((resolve) => {
            resolve(10);
            return () => {};
          }, "task-a"),
          action<number>((resolve) => {
            resolve(20);
            return () => {};
          }, "task-b"),
        ]);
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let aExecuted = false;
      let bExecuted = false;
      let result = await run(function* () {
        return yield* all([
          action<number>((resolve) => {
            aExecuted = true;
            resolve(100);
            return () => {};
          }, "task-a"),
          action<number>((resolve) => {
            bExecuted = true;
            resolve(200);
            return () => {};
          }, "task-b"),
        ]);
      }, { stream: replayStream });

      expect(aExecuted).toEqual(false);
      expect(bExecuted).toEqual(false);
      expect(result).toEqual([10, 20]);
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes after all() with subsequent live effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let [a, b] = yield* all([
          action<number>((resolve) => {
            resolve(10);
            return () => {};
          }, "task-a"),
          action<number>((resolve) => {
            resolve(20);
            return () => {};
          }, "task-b"),
        ]);
        let extra = yield* action<number>((resolve) => {
          resolve(30);
          return () => {};
        }, "after-all");
        return a + b + extra;
      }, { stream: recordStream });

      // Step 2: Truncate before "after-all"
      let events = recordStream.read().map((e) => e.event);
      let cutIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "after-all",
      );
      expect(cutIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(events.slice(0, cutIdx));

      // Step 3: Resume
      let afterAllExecuted = false;
      let result = await run(function* () {
        let [a, b] = yield* all([
          action<number>((resolve) => {
            resolve(10);
            return () => {};
          }, "task-a"),
          action<number>((resolve) => {
            resolve(20);
            return () => {};
          }, "task-b"),
        ]);
        let extra = yield* action<number>((resolve) => {
          afterAllExecuted = true;
          resolve(30);
          return () => {};
        }, "after-all");
        return a + b + extra;
      }, { stream: partialStream });

      expect(afterAllExecuted).toEqual(true);
      expect(result).toEqual(60);
    });
  });
});

describe("durable race", () => {
  describe("recording", () => {
    it("records events for race() and returns the winner", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        return yield* race([
          action<string>((resolve) => {
            resolve("fast");
            return () => {};
          }, "racer-fast"),
          action<string>((resolve) => {
            // This one never resolves synchronously — fast wins
            return () => {};
          }, "racer-slow"),
        ]);
      }, { stream });

      expect(result).toEqual("fast");

      let events = allEvents(stream);
      let racerFast = events.find(
        (e) => e.type === "effect:yielded" && e.description === "racer-fast",
      );
      expect(racerFast).toBeDefined();
    });

    it("records events for race() with sleep operations", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        return yield* race([
          function* () {
            yield* sleep(1);
            return "a";
          }(),
          function* () {
            yield* sleep(100);
            return "b";
          }(),
        ]);
      }, { stream });

      // First sleep(1) should win
      expect(result).toEqual("a");
    });
  });

  describe("replay", () => {
    it("replays race() without re-executing effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        return yield* race([
          action<string>((resolve) => {
            resolve("winner");
            return () => {};
          }, "racer-fast"),
          action<string>((resolve) => {
            return () => {};
          }, "racer-slow"),
        ]);
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let fastExecuted = false;
      let result = await run(function* () {
        return yield* race([
          action<string>((resolve) => {
            fastExecuted = true;
            resolve("winner");
            return () => {};
          }, "racer-fast"),
          action<string>((resolve) => {
            return () => {};
          }, "racer-slow"),
        ]);
      }, { stream: replayStream });

      expect(fastExecuted).toEqual(false);
      expect(result).toEqual("winner");
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes after race() with subsequent live effects", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let winner = yield* race([
          action<string>((resolve) => {
            resolve("fast");
            return () => {};
          }, "racer-fast"),
          action<string>((resolve) => {
            return () => {};
          }, "racer-slow"),
        ]);
        let extra = yield* action<string>((resolve) => {
          resolve(" world");
          return () => {};
        }, "after-race");
        return winner + extra;
      }, { stream: recordStream });

      // Step 2: Truncate before "after-race"
      let events = recordStream.read().map((e) => e.event);
      let cutIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "after-race",
      );
      expect(cutIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(events.slice(0, cutIdx));

      // Step 3: Resume
      let afterRaceExecuted = false;
      let result = await run(function* () {
        let winner = yield* race([
          action<string>((resolve) => {
            resolve("fast");
            return () => {};
          }, "racer-fast"),
          action<string>((resolve) => {
            return () => {};
          }, "racer-slow"),
        ]);
        let extra = yield* action<string>((resolve) => {
          afterRaceExecuted = true;
          resolve(" world");
          return () => {};
        }, "after-race");
        return winner + extra;
      }, { stream: partialStream });

      expect(afterRaceExecuted).toEqual(true);
      expect(result).toEqual("fast world");
    });
  });
});

describe("durable all + race combined", () => {
  it("records and replays nested all inside race", async () => {
    // Step 1: Record
    let recordStream = new InMemoryDurableStream();

    await run(function* () {
      return yield* race([
        all([
          action<number>((resolve) => {
            resolve(1);
            return () => {};
          }, "group-a-1"),
          action<number>((resolve) => {
            resolve(2);
            return () => {};
          }, "group-a-2"),
        ]),
        all([
          action<number>((resolve) => {
            return () => {}; // never resolves
          }, "group-b-1"),
          action<number>((resolve) => {
            return () => {};
          }, "group-b-2"),
        ]),
      ]);
    }, { stream: recordStream });

    // Step 2: Replay
    let replayStream = InMemoryDurableStream.from(
      recordStream.read().map((e) => e.event),
    );

    let groupAExecuted = false;
    let result = await run(function* () {
      return yield* race([
        all([
          action<number>((resolve) => {
            groupAExecuted = true;
            resolve(1);
            return () => {};
          }, "group-a-1"),
          action<number>((resolve) => {
            resolve(2);
            return () => {};
          }, "group-a-2"),
        ]),
        all([
          action<number>((resolve) => {
            return () => {};
          }, "group-b-1"),
          action<number>((resolve) => {
            return () => {};
          }, "group-b-2"),
        ]),
      ]);
    }, { stream: replayStream });

    expect(groupAExecuted).toEqual(false);
    expect(result).toEqual([1, 2]);
  });
});
