import type { Operation } from "./types.ts";
import { action, suspend } from "./instructions.ts";

/**
 * Sleep for the given amount of milliseconds.
 *
 * @example
 * ```typescript
 * import { main, sleep } from 'effection';
 *
 * await main(function*() {
 *   yield* sleep(2000);
 *   console.log("Hello lazy world!");
 * });
 * ```
 *
 * @param duration - the number of milliseconds to sleep
 */
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
