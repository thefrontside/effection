import { Controller } from './controller';
import { createFuture } from '../future';

export function createSuspendController<TOut>(): Controller<TOut> {
  let { resolve, future } = createFuture<TOut>();

  function start() {
    // no op
  }

  function halt() {
    resolve({ state: 'halted' });
  }

  return { start, halt, future, type: 'suspend' };
}
