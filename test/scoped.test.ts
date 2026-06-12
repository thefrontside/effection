import { box } from "../lib/box.ts";
import {
  action,
  createContext,
  race,
  resource,
  run,
  scoped,
  sleep,
  spawn,
  suspend,
  type Operation,
  useScope,
} from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("scoped", () => {
  describe("task", () => {
    it("shuts down after completion", () =>
      run(function* () {
        let didEnter = false;
        let didExit = false;

        yield* scoped(function* () {
          yield* spawn(function* () {
            try {
              didEnter = true;
              yield* suspend();
            } finally {
              didExit = true;
            }
          });
          yield* sleep(0);
        });

        expect(didEnter).toBe(true);
        expect(didExit).toBe(true);
      }));

    it("shuts down after error", () =>
      run(function* () {
        let didEnter = false;
        let didExit = false;

        try {
          yield* scoped(function* () {
            yield* spawn(function* () {
              try {
                didEnter = true;
                yield* suspend();
              } finally {
                didExit = true;
              }
            });
            yield* sleep(0);
            throw new Error("boom!");
          });
        } catch (error) {
          expect(error).toMatchObject({ message: "boom!" });
          expect(didEnter).toBe(true);
          expect(didExit).toBe(true);
        }
      }));

    it("delimits error boundaries", async () =>
      await run(function* () {
        try {
          yield* scoped(function* () {
            yield* spawn(function* () {
              throw new Error("boom!");
            });
            yield* suspend();
          });
        } catch (error) {
          expect(error).toMatchObject({ message: "boom!" });
        }
      }));
  });
  describe("resource", () => {
    it("shuts down after completion", () =>
      run(function* () {
        let status = "pending";
        yield* scoped(function* () {
          yield* resource<void>(function* (provide) {
            try {
              status = "open";
              yield* provide();
            } finally {
              status = "closed";
            }
          });
          yield* sleep(0);
          expect(status).toEqual("open");
        });
        expect(status).toEqual("closed");
      }));

    it("shuts down after error", () =>
      run(function* () {
        let status = "pending";
        try {
          yield* scoped(function* () {
            yield* resource<void>(function* (provide) {
              try {
                status = "open";
                yield* provide();
              } finally {
                status = "closed";
              }
            });
            yield* sleep(0);
            expect(status).toEqual("open");
            throw new Error("boom!");
          });
        } catch (error) {
          expect((error as Error).message).toEqual("boom!");
          expect(status).toEqual("closed");
        }
      }));

    it("delimits error boundaries", () =>
      run(function* () {
        try {
          yield* scoped(function* () {
            yield* resource<void>(function* (provide) {
              yield* spawn(function* () {
                yield* sleep(0);
                throw new Error("boom!");
              });
              yield* provide();
            });

            yield* suspend();
          });
        } catch (error) {
          expect(error).toMatchObject({ message: "boom!" });
        }
      }));
  });
  describe("context", () => {
    let context = createContext<string>("greetting", "hi");
    it("is restored after exiting scope", () =>
      run(function* () {
        yield* scoped(function* () {
          yield* context.set("hola");
        });
        expect(yield* context.get()).toEqual("hi");
      }));

    it("is restored after erroring", () =>
      run(function* () {
        try {
          yield* scoped(function* () {
            yield* context.set("hola");
            throw new Error("boom!");
          });
        } catch (error) {
          expect(error).toMatchObject({ message: "boom!" });
        } finally {
          expect(yield* context.get()).toEqual("hi");
        }
      }));
  });

  it("throws errors at the correct point when there are multiple nested scopes", async () => {
    let task = run(function* () {
      return yield* scoped(function* () {
        yield* spawn(function* () {
          yield* sleep(1);
          throw new Error("boom!");
        });

        yield* box(() =>
          scoped(function* () {
            yield* scoped(function* () {
              yield* suspend();
            });
          })
        );
      });
    });

    await expect(task).rejects.toMatchObject({ message: "boom!" });
  });

  it("does not execute code after scoped() when halted during async teardown", async () => {
    let leaked = false;
    let task = run(function* () {
      yield* scoped(function* () {
        yield* spawn(function* () {
          yield* sleep(5000);
        });
        yield* suspend();
      });
      leaked = true;
    });

    await task.halt();

    expect(leaked).toBe(false);
  });

  it("does not advance loop after external resolve with nested scoped + race", async () => {
    let events: string[] = [];

    function* scopedAction<T>(
      op: (
        resolve: (value: T) => void,
        reject: (error: Error) => void,
      ) => Operation<void>,
    ): Operation<T> {
      let scope = yield* useScope();
      return yield* action((resolve, reject) => {
        let task = scope.run(() => scoped(() => op(resolve, reject)));
        return () => task.halt();
      });
    }

    let task = run(function* () {
      return yield* scopedAction<{ status: number }>(function* (resolve) {
        let scope = yield* useScope();
        for (let round of [1, 2]) {
          events.push(`round-${round}-start`);

          let result = yield* scoped(function* () {
            yield* scoped(function* () {
              yield* race([
                (function* () {
                  yield* sleep(5000);
                  return "timeout";
                })(),
                (function* () {
                  yield* sleep(50);
                  return "step";
                })(),
              ]);
            });

            if (round === 1) {
              return { passed: false };
            }

            return { passed: true };
          });

          events.push(`round-${round}-result:${result.passed}`);

          if (!result.passed) {
            events.push("round-failed-trigger-shutdown");
            scope.run(function* () {
              resolve({ status: 130 });
            });
          }
        }

        resolve({ status: 0 });
      });
    });

    await task;

    expect(events).toContain("round-failed-trigger-shutdown");
    expect(events).not.toContain("round-2-start");
  });

  it("does not advance loop after external resolve in minimal action baseline", async () => {
    let events: string[] = [];

    function* scopedAction<T>(
      op: (
        resolve: (value: T) => void,
        reject: (error: Error) => void,
      ) => Operation<void>,
    ): Operation<T> {
      let scope = yield* useScope();
      return yield* action((resolve, reject) => {
        let task = scope.run(() => op(resolve, reject));
        return () => task.halt();
      });
    }

    let task = run(function* () {
      return yield* scopedAction<{ status: number }>(function* (resolve) {
        let scope = yield* useScope();
        for (let round of [1, 2]) {
          events.push(`round-${round}-start`);
          yield* sleep(10);
          if (round === 1) {
            events.push("round-failed-trigger-shutdown");
            scope.run(function* () {
              resolve({ status: 130 });
            });
          }
        }
        resolve({ status: 0 });
      });
    });

    await task;

    expect(events).toContain("round-failed-trigger-shutdown");
    expect(events).not.toContain("round-2-start");
  });
});
