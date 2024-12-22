import type { Result } from "./result.ts";
import type { Subscriber } from "./types.ts";

export function drain<T>(end: (result: Result<T>) => void): Subscriber<T> {
  return (next) => {
    if (next.done) {
      end(next.value);
    }
  };
}
