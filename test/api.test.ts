import { run } from "../mod.ts";
import { createApi } from "../experimental.ts";
import { constant } from "../lib/constant.ts";
import { type Operation, spawn } from "../lib/mod.ts";
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
    let api = createApi("test", {
      *test(order: string[]): Operation<string[]> {
        return order;
      },
    });

    await run(function* outer() {
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("outermax"));
          return output.concat("/outermax");
        },
      }, { capture: true });
      yield* api.around({
        *test(args, next) {
          let [input] = args;
          let output = yield* next(input.concat("outermin"));
          return output.concat("/outermin");
        },
      });

      let task = yield* spawn(function* inner() {
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            let output = yield* next(input.concat("innermax"));
            return output.concat("/innermax");
          },
        }, { capture: true });
        yield* api.around({
          *test(args, next) {
            let [input] = args;
            let output = yield* next(input.concat("innermin"));
            return output.concat("/innermin");
          },
        });

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
});
