import { Operation } from '../operation';
import { timeout } from './timeout';
import { race } from './race';
import { setLabels } from '../labels';

export function withTimeout<T>(duration: number, operation: Operation<T>): Operation<T> {
  return setLabels(
    race([timeout(duration) as Operation<T>, operation]),
    { name: 'withTimeout', duration }
  );
}
