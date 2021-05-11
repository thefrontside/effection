import { Operation } from '../operation';
import { timeout } from './timeout';

export function withTimeout<T>(duration: number, operation: Operation<T>): Operation<T> {
  return function*(task) {
    task.spawn(timeout(duration));
    return yield operation;
  };
}
