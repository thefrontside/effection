import type { Context, Frame, Future, Operation, Scope } from "../types.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";

export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  let [scope] = createScope(frame);
  return scope;
}

export function createScope(frame?: Frame): [Scope, () => Future<void>] {
  let parent = frame ?? createFrame({ operation: suspend });

  let scope = create<Scope>("Scope", {}, {
    run<T>(operation: () => Operation<T>) {
      return parent.createChild(operation).enter();
    },
    get<T>(context: Context<T>) {
      let { key, defaultValue } = context;
      return (parent.context[key] ?? defaultValue) as T | undefined;
    },
    set<T>(context: Context<T>, value: T) {
      let { key } = context;
      parent.context[key] = value;
      return value;
    },
  });

  return [scope, parent.enter().halt];
}
