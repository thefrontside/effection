import {
  createContext as $createContext,
  getframe,
  type Operation,
  resource,
} from "./effection.ts";

export interface Context<T> extends Operation<T> {
  set(value: T): Operation<T>;
}

export function createContext<T>(name: string, defaultValue?: T): Context<T> {
  return {
    ...$createContext(name, defaultValue),
    *set(value) {
      let frame = yield* getframe();
      let original = frame.context[name];
      frame.context[name] = value;

      yield* useFinally(function* () {
        if (typeof original === "undefined") {
          delete frame.context[name];
        } else {
          frame.context[name] = original;
        }
      });
      return value;
    },
  };
}

export function useFinally(op: () => Operation<void>): Operation<void> {
  return resource(function* (provide) {
    try {
      yield* provide();
    } finally {
      yield* op();
    }
  });
}
