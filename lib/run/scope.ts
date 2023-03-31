import type { Operation, Scope } from "../types.ts";
import { createFrame } from "./frame.ts";
import { create } from "./create.ts";
import { futurize } from "../future.ts";
import { getframe } from "../instructions.ts";
import { Err } from "../result.ts";

export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  return createScope(frame);
}

export function createScope(frame = createFrame()): Scope {
  return create<Scope>("Scope", {}, {
    run<T>(operation: () => Operation<T>) {
      let block = frame.run(operation);
      let future = futurize<T>(function* () {
        let blockResult = yield* block;
        if (blockResult.aborted) {
          if (blockResult.result.ok) {
            return Err(new Error("halted"));
          } else {
            return blockResult.result;
          }
        }

        if (blockResult.result.ok) {
          return blockResult.result;
        } else {
          let teardown = yield* frame.crash(blockResult.result.error);
          if (teardown.ok) {
            return blockResult.result;
          } else {
            return teardown;
          }
        }
      });

      let task = create("Task", {}, {
        ...future,
        halt: () => futurize(() => block.abort()),
      });

      block.enter();

      return task;
    },
    close: () => futurize(() => frame.destroy()),
    [Symbol.iterator]: () => futurize(() => frame)[Symbol.iterator](),
  });
}
