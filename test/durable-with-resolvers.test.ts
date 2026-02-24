import { action, run, withResolvers } from "../mod.ts";
import { InMemoryDurableStream } from "../lib/durable/stream.ts";
import type { DurableEvent } from "../lib/durable/types.ts";
import { describe, expect, it } from "./suite.ts";

/**
 * Helper: extract all events from the stream.
 */
function allEvents(stream: InMemoryDurableStream): DurableEvent[] {
  return stream.read().map((e) => e.event);
}

describe("durable withResolvers", () => {
  describe("recording", () => {
    it("records events for a withResolvers operation with custom description", async () => {
      let stream = new InMemoryDurableStream();

      let result = await run(function* () {
        let { operation, resolve } = withResolvers<string>("my-resolver");
        resolve("hello");
        return yield* operation;
      }, { stream });

      expect(result).toEqual("hello");

      let events = allEvents(stream);

      // The withResolvers action should be recorded with the custom description
      let resolverEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "my-resolver",
      );
      expect(resolverEffects.length).toEqual(1);

      // Its resolution should contain the value
      let effectId = resolverEffects[0].type === "effect:yielded"
        ? resolverEffects[0].effectId
        : "";
      let resolution = events.find(
        (e) => e.type === "effect:resolved" && e.effectId === effectId,
      );
      expect(resolution).toBeDefined();
      if (resolution && resolution.type === "effect:resolved") {
        expect(resolution.value).toEqual("hello");
      }
    });

    it("records pre-resolved withResolvers (resolve before yield)", async () => {
      let stream = new InMemoryDurableStream();

      let { operation, resolve } = withResolvers<number>("pre-resolved");
      // Resolve BEFORE the operation is yielded
      resolve(42);

      let result = await run(function* () {
        return yield* operation;
      }, { stream });

      expect(result).toEqual(42);

      let events = allEvents(stream);

      // The effect should still be recorded even though it resolved synchronously
      let resolverEffects = events.filter(
        (e) => e.type === "effect:yielded" && e.description === "pre-resolved",
      );
      expect(resolverEffects.length).toEqual(1);

      let effectId = resolverEffects[0].type === "effect:yielded"
        ? resolverEffects[0].effectId
        : "";
      let resolution = events.find(
        (e) => e.type === "effect:resolved" && e.effectId === effectId,
      );
      expect(resolution).toBeDefined();
      if (resolution && resolution.type === "effect:resolved") {
        expect(resolution.value).toEqual(42);
      }
    });
  });

  describe("replay", () => {
    it("replays withResolvers without re-executing the resolver", async () => {
      // Step 1: Record
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let { operation, resolve } = withResolvers<string>("replay-resolver");
        resolve("recorded-value");
        return yield* operation;
      }, { stream: recordStream });

      // Step 2: Replay
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let resolverEntered = false;
      let result = await run(function* () {
        // Create a new withResolvers — during replay, the action's enter()
        // should NOT be called, so resolve() never fires.
        let { operation, resolve } = withResolvers<string>("replay-resolver");
        resolve("WRONG-should-not-appear");
        resolverEntered = false; // reset

        // Wrap to track if effect.enter() is called
        let tracked = action<string>((res, rej) => {
          resolverEntered = true;
          // This should never run during replay
          res("WRONG");
          return () => {};
        }, "replay-resolver");

        // Actually use the original operation (which has the right description)
        return yield* operation;
      }, { stream: replayStream });

      // Value should come from the recorded stream
      expect(result).toEqual("recorded-value");
    });

    it("replays withResolvers rejection correctly", async () => {
      // Step 1: Record a rejected withResolvers
      let recordStream = new InMemoryDurableStream();

      let caughtMessage = "";
      await run(function* () {
        let { operation, reject } = withResolvers<string>("reject-resolver");
        reject(new Error("boom"));
        try {
          yield* operation;
        } catch (e) {
          caughtMessage = (e as Error).message;
        }
        return caughtMessage;
      }, { stream: recordStream });

      expect(caughtMessage).toEqual("boom");

      // Step 2: Replay — the error should replay from effect:errored
      let replayStream = InMemoryDurableStream.from(
        recordStream.read().map((e) => e.event),
      );

      let replayCaughtMessage = "";
      let result = await run(function* () {
        let { operation, reject } = withResolvers<string>("reject-resolver");
        reject(new Error("WRONG-should-not-appear"));
        try {
          yield* operation;
        } catch (e) {
          replayCaughtMessage = (e as Error).message;
        }
        return replayCaughtMessage;
      }, { stream: replayStream });

      // Error message should come from the recorded stream
      expect(result).toEqual("boom");
    });
  });

  describe("mid-workflow resume", () => {
    it("resumes after withResolvers with subsequent effects executing live", async () => {
      // Step 1: Record full workflow
      let recordStream = new InMemoryDurableStream();

      await run(function* () {
        let { operation, resolve } = withResolvers<string>("step-resolver");
        resolve("resolved-value");
        let value = yield* operation;

        let extra = yield* action<string>((resolve) => {
          resolve("after-resolver");
          return () => {};
        }, "post-resolver-action");

        return `${value}:${extra}`;
      }, { stream: recordStream });

      // Step 2: Truncate before "post-resolver-action"
      let events = recordStream.read().map((e) => e.event);
      let postIdx = events.findIndex(
        (e) => e.type === "effect:yielded" && e.description === "post-resolver-action",
      );
      expect(postIdx).toBeGreaterThan(0);

      let partialStream = InMemoryDurableStream.from(
        events.slice(0, postIdx),
      );

      // Step 3: Resume
      let postActionExecuted = false;
      let result = await run(function* () {
        let { operation, resolve } = withResolvers<string>("step-resolver");
        resolve("resolved-value");
        let value = yield* operation;

        let extra = yield* action<string>((resolve) => {
          postActionExecuted = true;
          resolve("after-resolver");
          return () => {};
        }, "post-resolver-action");

        return `${value}:${extra}`;
      }, { stream: partialStream });

      // withResolvers should have been replayed
      // post-resolver-action should have executed live
      expect(postActionExecuted).toEqual(true);
      expect(result).toEqual("resolved-value:after-resolver");
    });
  });
});
