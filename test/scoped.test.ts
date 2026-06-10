import { box } from "../lib/box.ts";
import { callcc } from "../lib/callcc.ts";
import {
  createContext,
  race,
  resource,
  run,
  scoped,
  sleep,
  spawn,
  suspend,
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

  // regression for https://github.com/thefrontside/effection/issues/1185:
  // externally resolving a callcc must unwind a scoped() + race() body and
  // stop the surrounding loop instead of continuing to the next iteration.
  it("propagates halt out of a scoped() + race() loop when callcc resolves externally", async () => {
    let events: string[] = [];
    let triggerShutdown!: () => void;

    let task = run(function* () {
      return yield* callcc<{ status: number }>(function* (resolve) {
        let scope = yield* useScope();

        triggerShutdown = () => {
          scope.run(() => resolve({ status: 130 }));
        };

        for (let round of [1, 2, 3]) {
          events.push(`round-${round}-start`);

          yield* scoped(function* () {
            events.push(`round-${round}-resource`);
            try {
              for (let step of [1, 2, 3]) {
                // both candidates sleep so neither can resolve before the
                // synchronous triggerShutdown() below; duration only bounds
                // how fast a regression (no halt) fails.
                let result = yield* race([
                  (function* () {
                    yield* sleep(10);
                    return "timeout";
                  })(),
                  (function* () {
                    yield* sleep(10);
                    return `step-${step}`;
                  })(),
                ]);
                events.push(`step-${step}-result: ${result}`);
              }
            } finally {
              events.push(`round-${round}-teardown`);
            }
          });

          events.push(`round-${round}-complete`);
        }
      });
    });

    // round 1 is now suspended inside race(); halt it from the outside.
    triggerShutdown();

    await expect(task).resolves.toEqual({ status: 130 });

    expect(events).toEqual([
      "round-1-start",
      "round-1-resource",
      "round-1-teardown",
    ]);
  });
});
