import { Operation } from '../operation';
import { sleep } from './sleep';
import { withLabels } from '../labels';

class TimeoutError extends Error {
  name = "TimeoutError"
}

export function timeout(duration: number): Operation<never> {
  return withLabels(function*() {
    yield sleep(duration)
    throw new TimeoutError(`timed out after ${duration}ms`);
  }, { name: 'timeout', duration });
}
