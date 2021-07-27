import { Operation } from '../operation';
import { timeout } from './timeout';
import { spawn } from './spawn';
import { withLabels } from '../labels';

export function withTimeout<T>(duration: number, operation: Operation<T>): Operation<T> {
  return withLabels(function*() {
    yield spawn(timeout(duration));
    return yield operation;
  }, { name: 'withTimeout', duration });
}
