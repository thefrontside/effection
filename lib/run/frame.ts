import type { Block, Frame, Result, Task } from "../types.ts";

import { futurize } from "../future.ts";
import { evaluate } from "../deps.ts";

import { createEventStream } from "./event-stream.ts";
import { createBlock } from "./block.ts";
import { create } from "./create.ts";
import { Err, Ok } from "../result.ts";

export function createFrameTask<T>(frame: Frame, block: Block<T>): Task<T> {
  let future = futurize<T>(function* () {
    let blockResult = yield* block;
    let teardown = yield* frame.destroy();
    if (!teardown.ok) {
      return teardown;
    } else if (blockResult.aborted) {
      return Err(new Error("halted"));
    } else {
      return blockResult.result;
    }
  });

  return {
    ...future,
    halt: () =>
      futurize(function* () {
        let killblock = yield* block.abort();
        let killframe = yield* frame.destroy();
        if (!killframe.ok) {
          return killframe;
        } else {
          return killblock;
        }
      }),
  };
}

let ids = 0;
export function createFrame(parent?: Frame): Frame {
  let children = new Set<Frame>();
  let running = new Set<Block>();
  let context = Object.create(parent?.context ?? {});
  let results = createEventStream<void, Result<void>>();

  let teardown = createEventStream<void, Result<void>>();

  evaluate(function* () {
    let current = yield* teardown;
    for (let block of running) {
      let teardown = yield* block.abort();
      if (!teardown.ok) {
        current = teardown;
      }
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

  let frame: Frame = create<Frame>("Frame", { id: ids++, context }, {
    createChild() {
      let child = createFrame(frame);
      children.add(child);
      evaluate(function* () {
        yield* child;
        children.delete(child);
      });
      return child;
    },
    run(operation) {
      let block = createBlock(frame, operation);
      running.add(block);
      evaluate(function* () {
        yield* block;
        running.delete(block);
      });
      return block;
    },
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
