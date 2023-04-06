import { describe, expect, it } from "./suite.ts";
import { Operation, resource, run, sleep, spawn, suspend } from "../mod.ts";

type State = { status: string };

function createResource(container: State): Operation<State> {
  return resource(function* (provide) {
    yield* spawn(function* () {
      yield* sleep(5);
      container.status = "active";
    });

    yield* sleep(1);

    try {
      yield* provide(container);
    } finally {
      container.status = "finalized";
    }
  });
}

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
});
