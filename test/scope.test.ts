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
  it("can be used to run operations", async () => {
    let [scope] = createScope();
    let t1 = run(() =>
      scope.spawn(function* () {
        return 1;
      })
    );
    let t2 = run(() =>
      scope.spawn(function* () {
        return 2;
      })
    );
    expect(await t1).toEqual(1);
    expect(await t2).toEqual(2);
  });

  it("succeeds on close if the frame has errored", async () => {
    let error = new Error("boom!");
    let [scope, close] = createScope();
    let bomb = run(() =>
      scope.spawn(function* () {
        throw error;
      })
    );
    await expect(bomb).rejects.toEqual(error);
    await expect(close()).resolves.toBeUndefined();
  });

  it("errors on close if there is an problem in teardown", async () => {
    let error = new Error("boom!");
    let [scope, close] = createScope();
    run(() =>
      scope.spawn(function* () {
        try {
          yield* suspend();
        } finally {
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      })
    );
    await expect(close()).rejects.toEqual(error);
  });

  it("still closes open resources whenever something errors", async () => {
    let error = new Error("boom!");
    let [scope, close] = createScope();
    let tester: Tester = {};

    run(() =>
      scope.spawn(function* () {
        yield* useTester(tester);
        yield* suspend();
      })
    );

    run(() =>
      scope.spawn(function* () {
        throw error;
      })
    );
    await expect(close()).resolves.toBeUndefined();
    expect(tester.status).toEqual("closed");
  });

  it("let's you capture scope from an operation", async () => {
    let tester: Tester = {};
    await run(function* () {
      let scope = yield* useScope();
      yield* scope.spawn(function* () {
        yield* useTester(tester);
        yield* suspend();
      });
      yield* sleep(1);
      expect(tester.status).toEqual("open");
    });
    expect(tester.status).toEqual("closed");
  });

  it("has a separate context for each operation it runs", async () => {
    let cxt = createContext<number>("number");

    function* incr() {
      let value = yield* cxt.expect();
      return yield* cxt.set(value + 1);
    }

    await run(function* () {
      let scope = yield* useScope();
      yield* cxt.set(1);

      let first = yield* scope.spawn(incr);
      let second = yield* scope.spawn(incr);
      let third = yield* scope.spawn(incr);

      expect(yield* first).toEqual(2);
      expect(yield* second).toEqual(2);
      expect(yield* third).toEqual(2);

      expect(yield* cxt.expect()).toEqual(1);
    });
  });

  it("can get and set a context programatically", async () => {
    let context = createContext<string>("aString");
    let [scope] = createScope();
    expect(scope.get(context)).toEqual(void 0);
    expect(scope.set(context, "Hello World!")).toEqual("Hello World!");
    expect(scope.get(context)).toEqual("Hello World!");
    await expect(run(() => scope.spawn(() => context.expect()))).resolves
      .toEqual("Hello World!");
  });

  it("propagates uncaught errors within a scope", async () => {
    let error = new Error("boom");
    let result = run(function* () {
      let scope = yield* useScope();
      yield* scope.spawn(function* () {
        throw error;
      });
      yield* suspend();
    });
    await expect(result).rejects.toBe(error);
  });

  it("destroys derived scopes when a scope is destroyed", async () => {
    let [parent, destroy] = createScope();
    let [child] = createScope(parent);

    let halted = false;

    child.run(function* () {
      try {
        yield* suspend();
      } finally {
        halted = true;
      }
    });

    await destroy();
    expect(halted).toEqual(true);
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
