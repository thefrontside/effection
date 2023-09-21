import type { Frame, Operation, Result, Task } from "../types.ts";

import { futurize } from "../future.ts";
import { evaluate } from "../deps.ts";
import { lazy } from "../lazy.ts";

import { createValue } from "./value.ts";
import { createBlock } from "./block.ts";
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
    let block = yield* createBlock(operation);
    let [setResults, results] = yield* createValue<Result<void>>();
    let [setTeardown, teardown] = yield* createValue<Result<void>>();

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
      enter: lazy(() => {
        let task = create<Task<T>>("Task", {}, {
          ...futurize<T>(function* () {
            let blockResult = yield* block;
            let destruction = yield* frame.destroy();

            if (!destruction.ok) {
              return destruction;
            } else if (blockResult.aborted) {
              return Err(new Error("halted"));
            } else {
              return blockResult.result;
            }
          }),
          halt: () =>
            futurize<void>(function* () {
              let killblock = yield* block.abort();
              let killframe = yield* frame.destroy();
              if (!killframe.ok) {
                return killframe;
              } else {
                return killblock;
              }
            }),
        });
        block.enter(frame);
        return task;
      }),
      *crash(error: Error) {
        setTeardown(Err(error));
        return yield* frame;
      },
      *destroy() {
        setTeardown(Ok(void 0));
        return yield* frame;
      },
      *[Symbol.iterator]() {
        return yield* results;
      },
    });

    let current = yield* teardown;
    let result = yield* block.abort();
    if (!result.ok) {
      current = result;
    }

    while (children.size !== 0) {
      for (let child of [...children].reverse()) {
        let teardown = yield* child.destroy();
        if (!teardown.ok) {
          current = teardown;
        }
      }
    }

    setResults(current);
  });

  return frame!;
}
