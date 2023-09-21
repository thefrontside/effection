import type {
  Block,
  BlockResult,
  Frame,
  Instruction,
  Operation,
  Result,
} from "../types.ts";

import { type Computation, reset, shift } from "../deps.ts";
import { lazy } from "../lazy.ts";
import { create } from "./create.ts";
import { Err, Ok } from "../result.ts";
import { createValue } from "./value.ts";

type InstructionResult =
  | {
    type: "settled";
    result: Result<unknown>;
  }
  | {
    type: "interrupted";
  };

export function* createBlock<T>(
  operation: () => Operation<T>,
): Computation<Block<T>> {
  let [setResults, results] = yield* createValue<BlockResult<T>>();
  let interrupt = () => {};
  let controller = new AbortController();
  let { signal } = controller;

  let enter = yield* reset<(frame: Frame<T>) => void>(function* () {

    let thunks: IteratorResult<Thunk, Result<T>>[] = [{
      done: false, value: $next(void 0)
    }];

    signal.addEventListener("abort", () => {
      thunks.unshift({ done: false, value: $abort() });
      interrupt();
    });

    let frame = yield* shift<Frame<T>>(function* (k) {
      return k.tail;
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
              thunks.unshift({done: false, value: $next(outcome.result.value) });
            } else {
              thunks.unshift({done: false, value: $throw(outcome.result.error) });
            }
          }
        }
      } catch (error) {
        thunks.unshift({ done: true, value: Err(error) });
      }
      thunk = thunks.pop()!;
    };

    let result = thunk.value;

    if (signal.aborted) {
      setResults({
        aborted: true,
        result: result as Result<T>,
      });
    } else {
      setResults({ aborted: false, result });
    }
  });

  let block: Block<T> = create<Block<T>>("Block", { name: operation.name }, {
    enter,
    abort: () => shift<Result<void>>((k) => reset(function* () {
      controller.abort();
      let blockResult = yield* block;
      k.tail(blockResult.result as Result<void>);
    })),
    [Symbol.iterator]: results[Symbol.iterator],
  });
  return block;
}

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
