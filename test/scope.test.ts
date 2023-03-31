import { describe, expect, it } from "./suite.ts";
import { action, createScope, resource, run, useScope } from "../mod.ts";

describe("Scope", () => {
  it("can be used to run actions", async () => {
    let scope = createScope();
    let t1 = scope.run(function* () {
      return 1;
    });
    let t2 = scope.run(function* () {
      return 2;
    });
    expect(await t1).toEqual(1);
    expect(await t2).toEqual(2);
  });

  it("can be used to run bare resources", async () => {
    let scope = createScope();
    let t1 = await scope.run(() => tester);
    let t2 = await scope.run(() => tester);
    expect(t1.status).toEqual("open");
    expect(t2.status).toEqual("open");
    await scope.close();
    expect(t1.status).toEqual("closed");
    expect(t2.status).toEqual("closed");
  });

  it("errors on close if the frame has errored", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    let bomb = scope.run(function* () {
      throw error;
    });
    await expect(bomb).rejects.toEqual(error);
    await expect(scope.close()).rejects.toEqual(error);
  });

  it("still closes open resources whenever something errors", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    let t = await scope.run(() => tester);
    scope.run(function* () {
      throw error;
    });
    await expect(scope.close()).rejects.toEqual(error);
    expect(t.status).toEqual("closed");
  });

  it("let's you capture scope from an operation", async () => {
    let t = await run(function* () {
      let scope = yield* useScope();
      let t = yield* action<Tester>(function* (resolve) {
        resolve(yield* scope.run(() => tester));
      });
      expect(t.status).toEqual("open");
      return t;
    });
    expect(t.status).toEqual("closed");
  });
});

interface Tester {
  status: "open" | "closed";
}

const tester = resource<Tester>(function* (provide) {
  let t: Tester = { status: "open" };
  try {
    yield* provide(t);
  } finally {
    t.status = "closed";
  }
});
