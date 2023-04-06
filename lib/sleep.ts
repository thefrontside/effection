import type { Operation } from "./types.ts";
import { action, suspend } from "./instructions.ts";

export function sleep(duration: number): Operation<void> {
  return action(function* sleep(resolve) {
    let timeoutId = setTimeout(resolve, duration);
    try {
      yield* suspend();
    } finally {
      clearTimeout(timeoutId);
    }
  });
}
