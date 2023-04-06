import type { Operation } from "./types.ts";
import { action } from "./instructions.ts";

export function call<T>(fn: () => Operation<T>): Operation<T> {
  return action(function* (resolve, reject) {
    try {
      resolve(yield* fn());
    } catch (error) {
      reject(error);
    }
  });
}
