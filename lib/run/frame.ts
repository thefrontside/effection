import type {
  Frame,
  Future,
  Instruction,
  Operation,
  Reject,
  Resolve,
  Result,
  Task,
} from "../types.ts";

import { type Computation, evaluate, reset, shift } from "../deps.ts";
import { shiftSync } from "../shift-sync.ts";
import { lazy } from "../lazy.ts";

import { createValue } from "./value.ts";
import { create } from "./create.ts";
import { Err, Ok } from "../result.ts";

let ids = 0;

export interface FrameOptions<T> {
  operation(): Operation<T>;
  parent?: Frame;
}

export function createFrame<T>(options: FrameOptions<T>): Frame<T> {
  let { operation, parent } = options;
  let children = new Set<Frame>();
  let context = Object.create(parent?.context ?? {});

  let frame: Frame<T>;

  evaluate(function* () {
    let [setResults, results] = yield* createValue<FrameResult<T>>();

    let exit: Resolve<Exit<T>> = () => {};

    let thunks: IteratorResult<Thunk, Result<T>>[] = [{
      done: false,
      value: $next(void 0),
    }];

    let crash: Error | void = void 0;

    let interrupt = () => {};

    let signal = {
      aborted: false,
    };

    let abort = (reason?: Error) => {
      if (!signal.aborted) {
        signal.aborted = true;
        crash = reason;
        thunks.unshift({ done: false, value: $abort() });
        interrupt();
      }
    };

    let start = yield* reset<Resolve<void>>(function* () {
      yield* shiftSync((k) => k.tail);

      let iterator = lazy(() => operation()[Symbol.iterator]());

      let thunk = thunks.pop()!;

      while (!thunk.done) {
        let getNext = thunk.value;
        try {
          let next: IteratorResult<Instruction> = getNext(iterator());

          if (next.done) {
            thunks.unshift({ done: true, value: Ok(next.value) });
          } else {
            let instruction = next.value;

            let outcome = yield* shift<InstructionResult>(function* (k) {
              interrupt = () => k.tail({ type: "interrupted" });

              try {
                k.tail({
                  type: "settled",
                  result: yield* instruction(
                    frame,
                    signal as unknown as AbortSignal,
                  ),
                });
              } catch (error) {
                k.tail({ type: "settled", result: Err(error) });
              }
            });

            if (outcome.type === "settled") {
              if (outcome.result.ok) {
                thunks.unshift({
                  done: false,
                  value: $next(outcome.result.value),
                });
              } else {
                thunks.unshift({
                  done: false,
                  value: $throw(outcome.result.error),
                });
              }
            }
          }
        } catch (error) {
          thunks.unshift({ done: true, value: Err(error) });
        }
        thunk = thunks.pop()!;
      }

      let result = thunk.value;

      if (!result.ok) {
        exit({ type: "result", result });
      } else if (crash) {
        exit({ type: "crashed", error: crash });
      } else if (signal.aborted) {
        exit({ type: "aborted" });
      } else {
        exit({ type: "result", result });
      }
    });

    frame = create<Frame<T>>("Frame", { id: ids++, context }, {
      createChild<X>(operation: () => Operation<X>) {
        let child = createFrame<X>({ operation, parent: frame });
        children.add(child);
        evaluate(function* () {
          yield* child;
          children.delete(child);
        });
        return child;
      },
      enter: () => {
        let task = createTask(frame, results);
        frame.enter = () => task;
        start();
        return task;
      },
      crash(error: Error) {
        abort(error);
        return frame;
      },
      destroy() {
        abort();
        return frame;
      },
      [Symbol.iterator]: results[Symbol.iterator],
    });

    let exitValue = yield* shiftSync<Exit<T>>((k) => {
      exit = k.tail;
    });

    let destruction = Ok(void 0);

    while (children.size !== 0) {
      for (let child of [...children].reverse()) {
        let teardown = yield* child.destroy();
        if (!teardown.ok) {
          destruction = teardown;
        }
      }
    }

    if (!destruction.ok) {
      setResults({ ok: false, error: destruction.error, exit: exitValue });
    } else {
      if (exitValue.type === "aborted") {
        setResults({ ok: true, value: void 0, exit: exitValue });
      } else if (exitValue.type === "result") {
        let { result } = exitValue;
        if (result.ok) {
          setResults({ ok: true, value: void 0, exit: exitValue });
        } else {
          setResults({ ok: false, error: result.error, exit: exitValue });
        }
      } else {
        setResults({ ok: false, error: exitValue.error, exit: exitValue });
      }
    }
  });

  return frame!;
}

type Exit<T> = {
  type: "aborted";
} | {
  type: "crashed";
  error: Error;
} | {
  type: "result";
  result: Result<T>;
};

type Thunk = ReturnType<typeof $next>;

// deno-lint-ignore no-explicit-any
const $next = <T>(value: any) =>
  function $next(i: Iterator<Instruction, T>) {
    return i.next(value);
  };

const $throw = <T>(error: Error) =>
  function $throw(i: Iterator<Instruction, T>) {
    if (i.throw) {
      return i.throw(error);
    } else {
      throw error;
    }
  };

const $abort = <T>(value?: unknown) =>
  function $abort(i: Iterator<Instruction, T>) {
    if (i.return) {
      return i.return(value as unknown as T);
    } else {
      return { done: true, value } as IteratorResult<Instruction, T>;
    }
  };

type InstructionResult =
  | {
    type: "settled";
    result: Result<unknown>;
  }
  | {
    type: "interrupted";
  };

type FrameResult<T> = Result<void> & {
  exit: Exit<T>;
};

import { action } from "../instructions.ts";

function createTask<T>(
  frame: Frame<T>,
  results: Computation<FrameResult<T>>,
): Task<T> {
  let promise: Promise<T>;

  let awaitResult = (resolve: Resolve<T>, reject: Reject) => {
    evaluate(function* () {
      let result = getResult(yield* results);

      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    });
  };

  let getPromise = () => {
    promise = new Promise<T>((resolve, reject) => {
      awaitResult(resolve, reject);
    });
    getPromise = () => promise;
    return promise;
  };

  let task = create<Task<T>>("Task", {}, {
    *[Symbol.iterator]() {
      let frameResult = evaluate<FrameResult<T> | void>(() => results);
      if (frameResult) {
        let result = getResult(frameResult);
        if (result.ok) {
          return result.value;
        } else {
          throw result.error;
        }
      } else {
        return yield* action<T>(function* (resolve, reject) {
          awaitResult(resolve, reject);
        });
      }
    },
    then: (...args) => getPromise().then(...args),
    catch: (...args) => getPromise().catch(...args),
    finally: (...args) => getPromise().finally(...args),
    halt() {
      let haltPromise: Promise<void>;
      let getHaltPromise = () => {
        haltPromise = new Promise((resolve, reject) => {
          awaitHaltResult(resolve, reject);
        });
        getHaltPromise = () => haltPromise;
        frame.destroy();
        return haltPromise;
      };
      let awaitHaltResult = (resolve: Resolve<void>, reject: Reject) => {
        evaluate(function* () {
          let result = yield* results;
          if (result.ok) {
            resolve(result.value);
          } else {
            reject(result.error);
          }
        });
      };
      return create<Future<void>>("Future", {}, {
        *[Symbol.iterator]() {
          let result = evaluate<FrameResult<T> | void>(() => results);

          if (result) {
            if (!result.ok) {
              throw result.error;
            }
          } else {
            yield* action<void>(function* (resolve, reject) {
              awaitHaltResult(resolve, reject);
            });
          }
        },
        then: (...args) => getHaltPromise().then(...args),
        catch: (...args) => getHaltPromise().catch(...args),
        finally: (...args) => getHaltPromise().finally(...args),
      });
    },
  });
  return task;
}

function getResult<T>(result: FrameResult<T>): Result<T> {
  if (!result.ok) {
    return result;
  } else if (result.exit.type === "aborted") {
    return Err(Error("halted"));
  } else if (result.exit.type === "crashed") {
    return Err(result.exit.error);
  } else {
    return result.exit.result;
  }
}
