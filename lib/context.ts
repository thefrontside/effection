import type { Context } from "./types.ts";
import { create } from "./run/create.ts";
import { useScope } from "./run/scope.ts";

export function createContext<T>(key: string, defaultValue?: T): Context<T> {
  let context: Context<T> = create<Context<T>>(`Context`, { key }, {
    defaultValue,
    *get() {
      let scope = yield* useScope();
      return scope.get(context);
    },
    *set(value: T) {
      let scope = yield* useScope();
      return scope.set(context, value);
    },
    *[Symbol.iterator]() {
      let value = yield* context.get();
      if (typeof value === "undefined") {
        throw new MissingContextError(`missing required context: '${key}'`);
      } else {
        return value;
      }
    },
  });

  return context;
}

class MissingContextError extends Error {
  name = "MissingContextError";
}
