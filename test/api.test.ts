import { run } from "../mod.ts";
import { createApi } from "../experimental.ts";
import { constant } from "../lib/constant.ts";
import {
  type Operation,
  resource,
  scoped,
  spawn,
  useScope,
} from "../lib/mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("api", () => {
  it("invokes operation functions as operations", async () => {
    let api = createApi("test", {
      *test() {
        return 5;
      },
    });

    await run(function* () {
      expect(yield* api.operations.test()).toEqual(5);
    });
  });

  it("invokes synchronous functions as operations", async () => {
    let api = createApi("test", {
      five: () => 5,
    });

    await run(function* () {
      expect(yield* api.operations.five()).toEqual(5);
    });
  });

  it("invokes operations as operations", async () => {
    let api = createApi("test", {
      five: {
        *[Symbol.iterator]() {
          return 5;
        },
      } as Operation<number>,
    });

    await run(function* () {
      expect(yield* api.operations.five).toEqual(5);
    });
  });

  it("invokes constants as operations", async () => {
    let api = createApi("test", {
      five: 5,
    });

    await run(function* () {
      expect(yield* api.operations.five).toEqual(5);
    });
  });

  it("can have middleware installed", async () => {
    let api = createApi("test", {
      constFive: 5,
      *operationFnFive() {
        return 5;
      },
      operationFive: constant(5),
      syncFive: () => 5 as number,
    });

    await run(function* () {
      yield* api.around({
        constFive(args, next) {
          return next(...args) * 2;
        },
        *operationFnFive(args, next) {
          return (yield* next(...args)) * 2;
        },
        *operationFive(args, next) {
          return (yield* next(...args)) * 2;
        },
        syncFive: (args, next) => next(...args) * 2,
      });

      expect(yield* api.operations.constFive).toEqual(10);
      expect(yield* api.operations.operationFnFive()).toEqual(10);
      expect(yield* api.operations.operationFive).toEqual(10);
      expect(yield* api.operations.syncFive()).toEqual(10);
    });
  });

  it("inherits middleware from scope", async () => {
    let api = createApi("test", {
      *num(value: number): Operation<number> {
        return value;
      },
    });

    await run(function* () {
      yield* api.around({
        *num(args, next) {
          return (yield* next(...args)) * 2;
        },
      });
      let task = yield* spawn(function* () {
        return yield* api.operations.num(5);
      });

      expect(yield* task).toEqual(10);
    });
  });

  it("applies maximal middleware before minimal middleware", async () => {
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    await run(function* () {
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("max1"));
          return output.concat("/max1");
        },
      });
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("max2"));
          return output.concat("/max2");
        },
      });
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("min1"));
          return output.concat("/min1");
        },
      });
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("min2"));
          return output.concat("/min2");
        },
      });

      expect(yield* api.operations.test([])).toEqual([
        "max1",
        "max2",
        "min1",
        "min2",
        "/min2",
        "/min1",
        "/max2",
        "/max1",
      ]);
    });
  });

  it("applies outer scope maxima more maximally than inner scopes maxima", async () => {
    let api = createApi(
      "test",
      {
        *test(order: string[]): Operation<string[]> {
          return order;
        },
      } as const,
    );

    await run(function* outer() {
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("outermax"));
          return output.concat("/outermax");
        },
      });
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("outermin"));
          return output.concat("/outermin");
        },
      }, { at: "min" });

      let task = yield* spawn(function* inner() {
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            let output = yield* next(input.concat("innermax"));
            return output.concat("/innermax");
          },
        });
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            let output = yield* next(input.concat("innermin"));
            return output.concat("/innermin");
          },
        }, { at: "min" });

        return yield* api.operations.test([]);
      });

      expect(yield* task).toEqual([
        "outermax",
        "innermax",
        "innermin",
        "outermin",
        "/outermin",
        "/innermin",
        "/innermax",
        "/outermax",
      ]);
    });
  });

  it("propagates new ancestor middleware to existing child scopes", async () => {
    let api = createApi("test", {
      *num(value: number): Operation<number> {
        return value;
      },
    });

    await run(function* () {
      let nummer = yield* resource<{ num(): Operation<number> }>(
        function* (provide) {
          let scope = yield* useScope();
          yield* provide({
            *num() {
              return yield* scope.run(() => api.operations.num(5));
            },
          });
        },
      );

      yield* api.around({
        *num(args, next) {
          return (yield* next(...args)) * 2;
        },
      });

      expect(yield* nummer.num()).toEqual(10);
    });
  });

  it("propagates new ancestor middleware to existing child scopes that also have middleware", async () => {
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    await run(function* () {
      let tester = yield* resource<{ test(): Operation<string[]> }>(
        function* (provide) {
          let scope = yield* useScope();
          yield* api.around({
            *test(args, next) {
              let [input] = args;
              let output = yield* next(input.concat("child"));
              return output.concat("/child");
            },
          });
          yield* provide({
            *test() {
              return yield* scope.run(() => api.operations.test([]));
            },
          });
        },
      );

      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("parent"));
          return output.concat("/parent");
        },
      });

      expect(yield* tester.test()).toEqual([
        "parent",
        "child",
        "/child",
        "/parent",
      ]);
    });
  });

  it("does not duplicate existing ancestor middleware when propagating later additions", async () => {
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    await run(function* () {
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("parent-before"));
          return output.concat("/parent-before");
        },
      });

      let tester = yield* resource<{ test(): Operation<string[]> }>(
        function* (provide) {
          let scope = yield* useScope();
          yield* api.around({
            *test(args, next) {
              let [input] = args;
              let output = yield* next(input.concat("child"));
              return output.concat("/child");
            },
          });
          yield* provide({
            *test() {
              return yield* scope.run(() => api.operations.test([]));
            },
          });
        },
      );

      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("parent-after"));
          return output.concat("/parent-after");
        },
      });

      expect(yield* tester.test()).toEqual([
        "parent-before",
        "parent-after",
        "child",
        "/child",
        "/parent-after",
        "/parent-before",
      ]);
    });
  });

  it("isolates sibling scopes from each other's middleware", async () => {
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    function sibling(label: string) {
      return resource<{ test(): Operation<string[]> }>(function* (provide) {
        let scope = yield* useScope();
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            return (yield* next(input.concat(label))).concat(`/${label}`);
          },
        });
        yield* provide({
          *test() {
            return yield* scope.run(() => api.operations.test([]));
          },
        });
      });
    }

    await run(function* () {
      let a = yield* sibling("a");
      let b = yield* sibling("b");

      expect(yield* a.test()).toEqual(["a", "/a"]);
      expect(yield* b.test()).toEqual(["b", "/b"]);
      expect(yield* api.operations.test([])).toEqual([]);
    });
  });

  it("composes middleware across a three-level scope tree", async () => {
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    function layer(label: string) {
      return resource<{ test(): Operation<string[]> }>(function* (provide) {
        let scope = yield* useScope();
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            return (yield* next(input.concat(label))).concat(`/${label}`);
          },
        });
        yield* provide({
          *test() {
            return yield* scope.run(() => api.operations.test([]));
          },
        });
      });
    }

    await run(function* () {
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          return (yield* next(input.concat("grand"))).concat("/grand");
        },
      });

      let leaf = yield* resource<{ test(): Operation<string[]> }>(
        function* (provide) {
          yield* api.around({
            *test(args, next) {
              let [input] = args;
              return (yield* next(input.concat("parent"))).concat("/parent");
            },
          });
          let child = yield* layer("child");
          yield* provide(child);
        },
      );

      expect(yield* leaf.test()).toEqual([
        "grand",
        "parent",
        "child",
        "/child",
        "/parent",
        "/grand",
      ]);
    });
  });

  it("does not affect un-aroundified keys when middleware is installed for a different key", async () => {
    let api = createApi("test", {
      *foo(): Operation<number> {
        return 1;
      },
      *bar(): Operation<number> {
        return 1;
      },
    });

    await run(function* () {
      yield* api.around({
        *foo(args, next) {
          return (yield* next(...args)) * 100;
        },
      });

      expect(yield* api.operations.foo()).toEqual(100);
      expect(yield* api.operations.bar()).toEqual(1);
    });
  });

  it("does not leak middleware from a finished child scope back to its parent", async () => {
    let api = createApi("test", {
      *num(value: number): Operation<number> {
        return value;
      },
    });

    await run(function* () {
      let result = yield* scoped(function* () {
        yield* api.around({
          *num(args, next) {
            return (yield* next(...args)) * 2;
          },
        });
        return yield* api.operations.num(5);
      });

      expect(result).toEqual(10);
      expect(yield* api.operations.num(5)).toEqual(5);
    });
  });
});
