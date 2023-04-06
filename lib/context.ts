import type { Operation } from "./types.ts";
import { getframe } from "./instructions.ts";

export function createContext<T>(name: string, defaultValue?: T): Operation<T> {
  return {
    [Symbol.toStringTag]: `Context(${name})`,
    *[Symbol.iterator]() {
      let frame = yield* getframe();
      let context = frame.context[name] as T | undefined;
      if (!context) {
        if (typeof defaultValue !== "undefined") {
          return defaultValue;
        } else {
          throw new MissingContextError(
            `${context} '${name}' is not available`,
          );
        }
      }
      return context;
    },
  } as Operation<T>;
}

class MissingContextError extends Error {
  name = "MissingContextError";
}
