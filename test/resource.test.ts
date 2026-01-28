import { describe, expect, it } from "./suite.ts";
import {
  type Operation,
  resource,
  run,
  sleep,
  spawn,
  suspend,
} from "../mod.ts";

type State = { status: string };

describe("resource", () => {
  it("runs resource in task scope", async () => {
    let state = { status: "pending" };
    await run(function* () {
      let result = yield* createResource(state);
      expect(result).toBe(state);
      expect(state.status).toEqual("pending");
      yield* sleep(10);
      expect(state.status).toEqual("active");
    });
    expect(state.status).toEqual("finalized");
  });

  it("throws init error", async () => {
    let task = run(function* () {
      yield* resource(function* () {
        throw new Error("moo");
      });
      yield* suspend();
    });

    await expect(task).rejects.toHaveProperty("message", "moo");
  });

  it("can catch an error in init", async () => {
    let result = await run(function* () {
      try {
        yield* resource(function* () {
          throw new Error("moo");
        });
      } catch (error) {
        return error;
      }
    });

    expect(result).toMatchObject({ message: "moo" });
  });

  it("raises an error if an error occurs after init", async () => {
    let task = run(function* () {
      yield* resource<void>(function* (provide) {
        yield* spawn(function* () {
          yield* sleep(1);
          throw new Error("moo");
        });
        yield* provide();
      });
      try {
        yield* suspend();
      } catch (error) {
        return error;
      }
    });
    await expect(task).rejects.toMatchObject({ message: "moo" });
  });

  it("terminates resource when task completes", async () => {
    let result = await run(function* () {
      return yield* createResource({ status: "pending" });
    });
    expect(result.status).toEqual("finalized");
  });

  it("can halt the resource constructor if the containing task halts", async () => {
    let state = { status: "pending" };
    let task = run(function* () {
      yield* createResource(state);
      yield* suspend();
    });

    await task.halt();

    expect(state.status).toEqual("pending");
  });

  it("does not relinquish control when a resource initialized synchronously", async () => {
    let sequence: number[] = [];

    await run(function* () {
      sequence.push(1);

      let task = yield* spawn(function* () {
        sequence.push(4);
      });

      yield* resource<void>(function* (provide) {
        sequence.push(2);
        yield* provide();
      });

      sequence.push(3);

      yield* task;
    });

    expect(sequence).toEqual([1, 2, 3, 4]);
  });

  it("is released in the reverse order from which it was acquired", async () => {
    let sequence: string[] = [];

    await run(function* () {
      yield* resource<void>(function* (provide) {
        try {
          yield* provide();
        } finally {
          sequence.push("first start");
          yield* sleep(5);
          sequence.push("first done");
        }
      });
      yield* resource<void>(function* (provide) {
        try {
          yield* provide();
        } finally {
          sequence.push("second start");
          yield* sleep(10);
          sequence.push("second done");
        }
      });
    });
    expect(sequence).toEqual([
      "second start",
      "second done",
      "first start",
      "first done",
    ]);
  });
});

function createResource(container: State): Operation<State> {
  return resource(function* (provide) {
    yield* spawn(function* () {
      yield* sleep(5);
      container.status = "active";
    });

    yield* sleep(0);

    try {
      yield* provide(container);
    } finally {
      container.status = "finalized";
    }
  });
}
