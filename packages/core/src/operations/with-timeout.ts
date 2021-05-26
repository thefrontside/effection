import { Operation } from '../operation';
import { timeout } from './timeout';
import { withLabels } from '../labels';

export function withTimeout<T>(duration: number, operation: Operation<T>): Operation<T> {
  return withLabels(function*(task) {
    task.spawn(timeout(duration));
    return yield operation;
  }, { name: 'withTimeout', duration });
}
