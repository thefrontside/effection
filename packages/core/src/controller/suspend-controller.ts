import { Controller } from './controller';
import { createFuture } from '../future';

export function createSuspendController<TOut>(): Controller<TOut> {
  let { produce, future } = createFuture<TOut>();

  function start() {
    // no op
  }

  function halt() {
    produce({ state: 'halted' });
  }

  return { start, halt, future, type: 'suspend', operation: undefined };
}
