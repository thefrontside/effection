import type { Frame, Operation, Scope } from "../types.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";
import { futurize } from "../future.ts";

export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  return createScope(frame);
}

export function createScope(frame?: Frame): Scope {
  let parent = frame ?? createFrame({ operation: suspend });

  let task = parent.enter();

  return create<Scope>("Scope", {}, {
    ...futurize<void>(() => parent),
    run<T>(operation: () => Operation<T>) {
      return parent.createChild(operation).enter();
    },
    close: task.halt,
  });
}
