import { Operation } from '../operation';
import { createFuture } from '../future';
import { withLabels } from '../labels';

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
  return withLabels((task) => {
    let { future, resolve } = createFuture<void>();
    if(duration != null) {
      let timeoutId = setTimeout(resolve, duration);
      task.consume(() => clearTimeout(timeoutId));
    }
    return future;
  }, { name: 'sleep', duration: (duration != null) ? duration : 'forever' });
}
