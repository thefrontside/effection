import type { Context, Operation } from "./types.ts";
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
    expect,
    *with<R>(value: T, operation: (value: T) => Operation<R>): Operation<R> {
      let scope = yield* useScope();
      let original = scope.hasOwn(context) ? scope.get(context) : undefined;
      try {
        return yield* operation(scope.set(context, value));
      } finally {
        if (typeof original === "undefined") {
          scope.delete(context);
        } else {
          scope.set(context, original);
        }
      }
    },
    [Symbol.iterator]() {
      console.warn(
        `⚠️ using a context (${key}) directly as an operation is deprecated. Use context.expect() instead`,
      );
      context[Symbol.iterator] = expect;
      return expect();
    },
  });

  function* expect() {
    let value = yield* context.get();
    if (typeof value === "undefined") {
      throw new MissingContextError(`missing required context: '${key}'`);
    } else {
      return value;
    }
  }

  return context;
}

class MissingContextError extends Error {
  override name = "MissingContextError";
}
