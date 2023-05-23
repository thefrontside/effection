import {
  getframe,
  type Operation,
} from "effection";

export interface Context<T> {
  set(value: T): Operation<T>;
  get(): Operation<T | undefined>;
  expect(): Operation<T>;
}

export function createContext<T>(name: string, defaultValue?: T): Context<T> {
  return {
    *set(value) {
      let frame = yield* getframe();

      frame.context[name] = value;

      return value;
    },
    *get() {
      let frame = yield* getframe();

      return (frame.context[name] ?? defaultValue) as T;
    },
    *expect() {
      let frame = yield* getframe();

      let value = (frame.context[name] ?? defaultValue) as T;

      if (value == null) {
        throw new Error(`missing required context: '${name}'`)
      }

      return value;
    }
  };
}
