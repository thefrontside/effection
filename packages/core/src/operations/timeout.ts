import { Operation } from '../operation';
import { sleep } from './sleep';

class TimeoutError extends Error {
  name = "TimeoutError"
}

export function *timeout(duration: number): Operation<void> {
  yield sleep(duration)
  throw new TimeoutError(`timed out after ${duration}ms`);
}
