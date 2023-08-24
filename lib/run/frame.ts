import type { Frame, Operation, Result, Task } from "../types.ts";

import { futurize } from "../future.ts";
import { evaluate } from "../deps.ts";
import { lazy } from "../lazy.ts";

import { createEventStream } from "./event-stream.ts";
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
  let block = createBlock(operation);
  let context = Object.create(parent?.context ?? {});
  let results = createEventStream<void, Result<void>>();

  let teardown = createEventStream<void, Result<void>>();

  evaluate(function* () {
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

    results.close(current);
  });

  let frame: Frame<T> = create<Frame<T>>("Frame", { id: ids++, context }, {
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
      teardown.close(Err(error));
      return yield* frame;
    },
    *destroy() {
      teardown.close(Ok(void 0));
      return yield* frame;
    },
    *[Symbol.iterator]() {
      return yield* results;
    },
  });

  return frame;
}
