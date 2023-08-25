import type { Frame, Future, Operation, Scope } from "../types.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";
import { futurize } from "../future.ts";

export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  let [scope] = createScope(frame);
  return scope;
}

export function createScope(frame?: Frame): [Scope, () => Future<void>] {
  let parent = frame ?? createFrame({ operation: suspend });

  let scope = create<Scope>("Scope", {}, {
    ...futurize<void>(() => parent),
    run<T>(operation: () => Operation<T>) {
      return parent.createChild(operation).enter();
    },
  });

  return [scope, parent.enter().halt];
}
