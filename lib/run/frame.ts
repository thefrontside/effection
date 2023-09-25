import type {
  Frame,
  Instruction,
  Operation,
  Resolve,
  Result,
  Task,
} from "../types.ts";

import { createFuture, type NewFuture } from "../future.ts";
import { evaluate, reset, shift } from "../deps.ts";
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
    let [setResults, results] = yield* createValue<Result<void>>();

    let exit: Resolve<Exit<T>> = () => {};

    let thunks: IteratorResult<Thunk, Result<T>>[] = [{
      done: false,
      value: $next(void 0),
    }];

    let crash: Error | void = void 0;

    let controller = new AbortController();

    let abort = (reason?: Error) => {
      crash = reason;
      controller.abort();
    };

    let [start, settled, destroyed] = yield* reset<
      [Resolve<void>, NewFuture<T>, NewFuture<void>]
    >(function* () {
      let settled = createFuture<T>();
      let destroyed = createFuture<void>();

      yield* shiftSync((k) => [k.tail, settled, destroyed]);

      let interrupt = () => {};
      let { signal } = controller;

      signal.addEventListener("abort", () => {
        thunks.unshift({ done: false, value: $abort() });
        interrupt();
      });

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
                  result: yield* instruction(frame, signal),
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
        let task = create<Task<T>>("Task", {}, {
          ...settled.future,
          halt: () => {
            controller.abort();
            return destroyed.future;
          },
        });
        start();
        frame.enter = () => task;
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
      destroyed.reject(destruction.error);
      settled.reject(destruction.error);
      setResults(destruction);
    } else {
      destroyed.resolve();
      if (exitValue.type === "aborted") {
        setResults(Ok(void 0));
        settled.reject(new Error("halted"));
      } else if (exitValue.type === "result") {
        let { result } = exitValue;
        if (result.ok) {
          setResults(Ok(void 0));
          settled.resolve(result.value);
        } else {
          setResults(result);
          settled.reject(result.error);
        }
      } else {
        setResults(Err(exitValue.error));
        settled.reject(exitValue.error);
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
