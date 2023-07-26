import type { Frame, Operation, Scope } from "../types.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";
import { futurize } from "../future.ts";
import { Ok } from "../result.ts";
import { evaluate } from "../deps.ts";

export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  return createScope(frame);
}

export function createScope(frame?: Frame): Scope {
  let children = new Set<Frame>();
  let parent = frame ?? createFrame({ operation: suspend });

  return create<Scope>("Scope", {}, {
    run<T>(operation: () => Operation<T>) {
      let child = parent.createChild(operation);
      children.add(child);
      evaluate(function* () {
        yield* child;
        children.delete(child);
      });
      return child.enter();
    },
    close: () =>
      futurize(function* () {
        let result = Ok<void>(void 0);
        for (let child of [...children]) {
          let destruction = yield* child.destroy();
          if (!destruction.ok) {
            result = destruction;
          }
        }
        return result;
      }),
    [Symbol.iterator]: () =>
      futurize(function* () {
        let result = Ok<void>(void 0);
        for (let child of [...children]) {
          let end = yield* child;
          if (!end.ok) {
            result = end;
          }
        }
        return result;
      })[Symbol.iterator](),
  });
}
