import type { Context } from "./types.ts";
import { getframe } from "./instructions.ts";

export function createContext<T>(name: string, defaultValue?: T): Context<T> {
  function* get() {
    let frame = yield* getframe();

    return (frame.context[name] ?? defaultValue) as T | undefined;
  }

  function* set(value: T) {
    let frame = yield* getframe();

    frame.context[name] = value;

    return value;
  }

  function* expect() {
    let value = yield* get();

    if (typeof value === "undefined") {
      throw new MissingContextError(`missing required context: '${name}'`);
    } else {
      return value;
    }
  }

  return { get, set, [Symbol.iterator]: expect };
}

class MissingContextError extends Error {
  name = "MissingContextError";
}
