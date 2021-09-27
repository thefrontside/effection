import { Operation } from '../operation';

/**
 * Sleep for the given amount of milliseconds. If no duration is given, then
 * sleep indefinitely.
 *
 * ### Example
 *
 * ```typescript
 * import { main, sleep } from 'effection';
 *
 * main(function*() {
 *   yield sleep(2000);
 *   console.log("Hello lazy world!");
 * });
 * ```
 *
 * @param duration the number of milliseconds to sleep
 */
export function sleep(duration?: number): Operation<void> {
  return {
    labels: { name: 'sleep', duration: (duration != null) ? duration : 'forever' },
    perform(resolve) {
      if(duration != null) {
        let timeoutId = setTimeout(resolve, duration);
        return () => clearTimeout(timeoutId);
      }
    }
  };
}
