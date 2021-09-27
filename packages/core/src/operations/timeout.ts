import { Operation } from '../operation';
import { sleep } from './sleep';
import { withLabels } from '../labels';

class TimeoutError extends Error {
  name = "TimeoutError"
}

/**
 * Throw an error after the given amount of milliseconds. See also {@link withTimeout}.
 *
 * ### Example
 *
 * ```typescript
 * import { main, spawn, timeout } from 'effection';
 *
 * main(function*() {
 *   yield spawn(timeout(2000));
 *   yield fetch('http://google.com');
 * });
 * ```
 *
 * @param duration the timeout duration in milliseconds
 */
export function timeout(duration: number): Operation<never> {
  return withLabels(function*() {
    yield sleep(duration);
    throw new TimeoutError(`timed out after ${duration}ms`);
  }, { name: 'timeout', duration });
}
