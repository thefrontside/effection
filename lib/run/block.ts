import type {
  Block,
  BlockResult,
  Frame,
  Instruction,
  Operation,
  Result,
} from "../types.ts";

import { createEventStream, forEach } from "./event-stream.ts";
import { evaluate, reset, shift } from "../deps.ts";
import { lazy } from "../lazy.ts";
import { create } from "./create.ts";
import { Err, Ok } from "../result.ts";

type InstructionResult =
  | {
    type: "settled";
    result: Result<unknown>;
  }
  | {
    type: "interrupted";
  };

export function createBlock<T>(
  frame: Frame,
  operation: () => Operation<T>,
): Block<T> {
  let results = createEventStream<void, BlockResult<T>>();
  let interrupt = createEventStream<void>();
  let thunks = createEventStream<ReturnType<typeof $next>, Result<T>>();
  let controller = new AbortController();
  let { signal } = controller;

  signal.addEventListener("abort", () => interrupt.close());

  let enter = evaluate<() => void>(function* () {
    yield* shift<void>(function* (k) {
      return k.tail;
    });

    yield* reset(function* () {
      yield* interrupt;
      thunks.push($abort());
    });

    yield* reset(function* () {
      let iterator = lazy(() => operation()[Symbol.iterator]());

      let result = yield* forEach(thunks, function* (getNext) {
        let next: IteratorResult<Instruction>;
        try {
          next = getNext(iterator());
        } catch (error) {
          return thunks.close(Err(error));
        }

        if (next.done) {
          return thunks.close(Ok(next.value));
        }

        let instruction = next.value;

        let outcome = yield* shift<InstructionResult>(function* (k) {
          yield* reset(function* () {
            yield* interrupt;
            k.tail({ type: "interrupted" });
          });

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
            thunks.push($next(outcome.result.value));
          } else {
            thunks.push($throw(outcome.result.error));
          }
        }
      });

      if (signal.aborted) {
        results.close({
          aborted: true,
          result: result as Result<T>,
        });
      } else {
        results.close({ aborted: false, result });
      }
    });

    thunks.push($next(void 0));
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
