import { action, run, sleep, suspend, useAbortSignal } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { isLiveOnly } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

describe("durable useAbortSignal", () => {
  describe("recording", () => {
    it("records AbortSignal as LiveOnlySentinel in workflow:return", async () => {
      let stream = new InMemoryDurableStream();

      let signal = await run(function* () {
        let signal = yield* useAbortSignal();
        expect(signal.aborted).toEqual(false);
        // Do something after getting the signal to create a recordable effect
        yield* sleep(0);
        return signal;
      }, { stream });

      // Signal should be aborted after scope exits
      expect(signal.aborted).toEqual(true);

      let events = allEvents(stream);

      // "await resource" is an infrastructure effect — it is never recorded
      // to the durable stream. The AbortSignal value appears as a
      // LiveOnlySentinel in the workflow:return event instead.
      let awaitResourceEvents = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "await resource",
      );
      expect(awaitResourceEvents.length).toEqual(0);

      // The workflow:return for the task scope should carry the AbortSignal
      // serialized as a LiveOnlySentinel.
      let workflowReturns = events.filter(
        (e) => e.type === "workflow:return",
      );
      // There should be at least one workflow:return with a LiveOnlySentinel
      let liveOnlyReturns = workflowReturns.filter(
        (e) => e.type === "workflow:return" && isLiveOnly(e.value),
      );
      expect(liveOnlyReturns.length).toBeGreaterThanOrEqual(1);

      // Verify the sentinel has the correct type metadata
      let sentinel = liveOnlyReturns[0];
      if (sentinel.type === "workflow:return" && isLiveOnly(sentinel.value)) {
        expect(sentinel.value.__type).toEqual("AbortSignal");
      }
    });

    it("records resource child scope for useAbortSignal", async () => {
      let stream = new InMemoryDurableStream();

      await run(function* () {
        yield* useAbortSignal();
        yield* sleep(0);
      }, { stream });

      let events = allEvents(stream);

      // useAbortSignal creates a resource which spawns a child scope
      let scopeCreated = events.filter((e) => e.type === "scope:created");
      // root + task scope + resource child scope = at least 3
      expect(scopeCreated.length).toBeGreaterThanOrEqual(3);

      // The resource child scope should have a suspend effect
      let suspendEvents = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );
      expect(suspendEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("replay", () => {
    it("replays a useAbortSignal workflow and produces the same final result", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let signal = yield* useAbortSignal();
        yield* sleep(0);
        return signal;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      // During replay, the resource re-executes (infrastructure effect),
      // creating a new AbortController. The workflow should complete
      // successfully with the signal aborted after scope exit.
      let replaySignal = await run(function* () {
        let signal = yield* useAbortSignal();
        yield* sleep(0);
        return signal;
      }, { stream: replayStream });

      // After scope exits, signal should be aborted (cleanup ran)
      expect(replaySignal.aborted).toEqual(true);
    });

    it("does not re-execute user-facing effects during replay", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        yield* useAbortSignal();
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "user-work");
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let workExecuted = false;
      await run(function* () {
        yield* useAbortSignal();
        yield* action<void>((resolve) => {
          workExecuted = true;
          resolve();
          return () => {};
        }, "user-work");
      }, { stream: replayStream });

      // The user-facing action should NOT have been re-executed
      expect(workExecuted).toEqual(false);
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes mid-workflow with abort signal still functional", async () => {
      // Step 1: Record full workflow
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let signal = yield* useAbortSignal();
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "step-1");
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "step-2");
      }, { stream: recordStream });

      // Step 2: Truncate after "step-1" (before "step-2")
      let events = recordStream.read().map((e) => e.event);
      let step2Idx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "step-2",
      );
      expect(step2Idx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, step2Idx),
      );

      // Step 3: Resume
      let liveExecutions: string[] = [];
      let signalAbortedDuring = true;
      let signalRef: AbortSignal | null = null;

      await run(function* () {
        let signal = yield* useAbortSignal();
        signalRef = signal;
        signalAbortedDuring = signal.aborted;

        yield* action<void>((resolve) => {
          liveExecutions.push("step-1");
          resolve();
          return () => {};
        }, "step-1");

        yield* action<void>((resolve) => {
          liveExecutions.push("step-2");
          resolve();
          return () => {};
        }, "step-2");
      }, { stream: partialStream });

      // step-1 should have been replayed, step-2 should be live
      expect(liveExecutions).not.toContain("step-1");
      expect(liveExecutions).toContain("step-2");

      // Signal should have been functional during execution
      expect(signalAbortedDuring).toEqual(false);

      // Signal should be aborted after scope exit
      expect(signalRef!.aborted).toEqual(true);
    });

    it("aborts signal on halt after replay", async () => {
      // Step 1: Record a workflow that suspends (gets halted)
      let recordStream = new InMemoryDurableStream();

      let task = run(function* () {
        let signal = yield* useAbortSignal();
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "before-suspend");
        yield* suspend();
      }, { stream: recordStream });

      // Wait a tick for the workflow to reach suspend, then halt
      await new Promise((r) => setTimeout(r, 10));
      await task.halt();

      // Step 2: Truncate to just before the suspend
      // (include "before-suspend" + resolution, but not the suspend effect)
      let events = recordStream.read().map((e) => e.event);
      let suspendIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "suspend",
      );

      let partialEvents = suspendIdx > 0
        ? events.slice(0, suspendIdx)
        : events;
      let partialStream = InMemoryDurableStream.from(partialEvents);

      // Step 3: Resume — will replay prefix, then enter live suspend
      let signalRef: AbortSignal | null = null;

      let resumedTask = run(function* () {
        let signal = yield* useAbortSignal();
        signalRef = signal;
        yield* action<void>((resolve) => {
          resolve();
          return () => {};
        }, "before-suspend");
        yield* suspend();
      }, { stream: partialStream });

      // Wait for the workflow to reach the live suspend
      await new Promise((r) => setTimeout(r, 10));

      // Signal should not be aborted while workflow is running
      expect(signalRef!.aborted).toEqual(false);

      // Halt the resumed workflow
      await resumedTask.halt();

      // Signal should now be aborted (cleanup ran on halt)
      expect(signalRef!.aborted).toEqual(true);
    });
  });
});
