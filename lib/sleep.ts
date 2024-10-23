import { Operation } from "./types.ts";
import { action } from "./action.ts";

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
  return action((resolve) => {
    let timeoutId = setTimeout(resolve, duration);
    return () => clearTimeout(timeoutId);
  }, `sleep(${duration})`);
}
