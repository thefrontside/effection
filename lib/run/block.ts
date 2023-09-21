import type {
  Block,
  BlockResult,
  Frame,
  Instruction,
  Operation,
  Result,
} from "../types.ts";

import { createEventStream, forEach } from "./event-stream.ts";
import { type Computation, reset, shift } from "../deps.ts";
import { lazy } from "../lazy.ts";
import { create } from "./create.ts";
import { Err, Ok } from "../result.ts";
import { createValue, createQueue } from "./value.ts";

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

    let thunks = yield* createQueue<IteratorResult<Thunk, Result<T>>>();

    signal.addEventListener("abort", () => {
      thunks.add({ done: false, value: $abort() });
      interrupt();
    });

    let frame = yield* shift<Frame<T>>(function* (k) {
      return k.tail;
    });

    yield* reset(function* () {
      let iterator = lazy(() => operation()[Symbol.iterator]());

      let thunk = yield* thunks.next();
      while (!thunk.done) {
        let getNext = thunk.value;
      //let result = yield* forEach(thunks, function* (getNext) {
        let next: IteratorResult<Instruction>;
        try {
          next = getNext(iterator());
        } catch (error) {
          thunks.add({ done: true, value: Err(error) });
          thunk = yield* thunks.next();
          continue;
        }

        if (next.done) {
          thunks.add({ done: true, value: Ok(next.value) });
          thunk = yield* thunks.next();
          continue;
        }

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
            thunks.add({done: false, value: $next(outcome.result.value) });
          } else {
            thunks.add({done: false, value: $throw(outcome.result.error) });
          }
        }
        thunk = yield* thunks.next();
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

    thunks.add({ done: false, value: $next(void 0) });
  });

  let block: Block<T> = create<Block<T>>("Block", { name: operation.name }, {
    enter,
    *abort() {
      return yield* shift<Result<void>>(function* (k) {
        yield* reset(function* () {
          let blockResult = yield* block;
          k.tail(blockResult.result as Result<void>);
        });
        controller.abort();
      });
    },
    *[Symbol.iterator]() {
      return yield* results;
    },
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
