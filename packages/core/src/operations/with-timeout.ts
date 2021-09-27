import { Operation } from '../operation';
import { timeout } from './timeout';
import { race } from './race';
import { setLabels } from '../labels';

/**
 * Runs the given operation and throws an error if it takes more than the given
 * number of milliseconds. See also {@link timeout}.
 *
 * ### Example
 *
 * ```typescript
 * import { main, spawn, withTimeout } from 'effection';
 *
 * main(function*() {
 *   yield withTimeout(2000, fetch('http://google.com'));
 * });
 * ```
 *
 * @param duration the timeout duration in milliseconds
 */
export function withTimeout<T>(duration: number, operation: Operation<T>): Operation<T> {
  return setLabels(
    race([timeout(duration) as Operation<T>, operation]),
    { name: 'withTimeout', duration }
  );
}
