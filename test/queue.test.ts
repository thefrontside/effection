import { describe, expect, it } from "./suite.ts";
import {
  action,
  createQueue,
  type Operation,
  run,
  sleep,
  spawn,
} from "../mod.ts";

describe("Queue", () => {
  it("adds value to an already waiting listener", async () => {
    await run(function* () {
      let q = createQueue<string, never>();
      let listener = yield* spawn(() => q.next());
      q.add("hello");
      expect(yield* listener).toEqual({ done: false, value: "hello" });
    });
  });

  it("only adds value to one listener if there are multiple", async () => {
    await run(function* () {
      let q = createQueue<string, never>();
      let listener1 = yield* spawn(() => abortAfter(q.next(), 10));
      let listener2 = yield* spawn(() => abortAfter(q.next(), 10));
      q.add("hello");
      expect([yield* listener1, yield* listener2].filter(Boolean)).toEqual([{
        done: false,
        value: "hello",
      }]);
    });
  });

  it("queues value if there is no listener", async () => {
    await run(function* () {
      let q = createQueue<string, never>();
      q.add("hello");
      expect(yield* q.next()).toEqual({
        done: false,
        value: "hello",
      });
    });
  });

  it("can close", async () => {
    await run(function* () {
      let q = createQueue<string, number>();
      let listener = yield* spawn(() => q.next());
      q.close(42);
      expect(yield* listener).toEqual({ done: true, value: 42 });
    });
  });
});

function abortAfter<T>(op: Operation<T>, ms: number): Operation<T | void> {
  return action(function* (resolve, reject) {
    yield* spawn(function* () {
      try {
        resolve(yield* op);
      } catch (error) {
        reject(error);
      }
    });
    yield* sleep(ms);
    resolve();
  });
}
