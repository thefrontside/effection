import { describe, expect, it } from "./suite.ts";
import {
  createContext,
  createScope,
  resource,
  run,
  sleep,
  suspend,
  useScope,
} from "../mod.ts";

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

  it("succeeds on close if the frame has errored", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    let bomb = scope.run(function* () {
      throw error;
    });
    await expect(bomb).rejects.toEqual(error);
    await expect(scope.close()).resolves.toBeUndefined();
  });

  it("errors on close if there is an problem in teardown", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    scope.run(function* () {
      try {
        yield* suspend();
      } finally {
        // deno-lint-ignore no-unsafe-finally
        throw error;
      }
    });
    await expect(scope.close()).rejects.toEqual(error);
  });

  it("still closes open resources whenever something errors", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    let tester: Tester = {};

    scope.run(function* () {
      yield* useTester(tester);
      yield* suspend();
    });

    scope.run(function* () {
      throw error;
    });
    await expect(scope.close()).resolves.toEqual(void 0);
    expect(tester.status).toEqual("closed");
  });

  it("let's you capture scope from an operation", async () => {
    let tester: Tester = {};
    await run(function* () {
      let scope = yield* useScope();
      scope.run(function* () {
        yield* useTester(tester);
        yield* suspend();
      });
      expect(tester.status).toEqual("open");
    });
    expect(tester.status).toEqual("closed");
  });

  it("has a separate context for each operation it runs", async () => {
    let cxt = createContext<number>("number");

    function* incr() {
      let value = yield* cxt;
      return yield* cxt.set(value + 1);
    }

    await run(function* () {
      let scope = yield* useScope();
      yield* cxt.set(1);

      let first = yield* scope.run(incr);
      let second = yield* scope.run(incr);
      let third = yield* scope.run(incr);

      expect(yield* cxt).toEqual(1);
      expect(first).toEqual(2);
      expect(second).toEqual(2);
      expect(third).toEqual(2);
    });
  });

  it("only shuts down the tasks that it created when closing", async () => {
    await run(function* () {
      let t1: Tester = {};
      let t2: Tester = {};
      let s1 = yield* useScope();
      let s2 = yield* useScope();

      s1.run(function* () {
        yield* useTester(t1);
        yield* suspend();
      });

      s2.run(function* () {
        yield* useTester(t2);
        yield* suspend();
      });

      expect(t1.status).toEqual("open");
      expect(t2.status).toEqual("open");

      yield* s1.close();

      expect(t1.status).toEqual("closed");
      expect(t2.status).toEqual("open");

      yield* s2.close();

      expect(t1.status).toEqual("closed");
      expect(t2.status).toEqual("closed");
    });
  });

  it("awaits all of its open tasks when it is yielded to", async () => {
    let message = "";
    let scope = createScope();

    scope.run(function* () {
      yield* sleep(0);
      message += "hello";
    });

    scope.run(function* () {
      yield* sleep(5);
      message += " world";
    });

    await run(() => scope);
    expect(message).toEqual("hello world");
  });

  it("fails when one of its outstanding tasks fails", async () => {
    let error = new Error("boom!");
    let scope = createScope();
    scope.run(function* () {
      yield* sleep(10);
      throw error;
    });
    await expect(run(() => scope)).rejects.toEqual(error);
  });
});

interface Tester {
  status?: "open" | "closed";
}

const useTester = (state: Tester) =>
  resource<Tester>(function* (provide) {
    try {
      state.status = "open";
      yield* provide(state);
    } finally {
      state.status = "closed";
    }
  });
