import { Controller } from './controller';
import { Task } from '../task';
import { createFuture, FutureLike } from '../future';

export function createFutureController<TOut>(task: Task<TOut>, future: FutureLike<TOut>): Controller<TOut> {
  let { future: inner, produce } = createFuture<TOut>();

  function start() {
    future.consume(produce);
  }

  function halt() {
    produce({ state: 'halted' });
  }

  return { start, halt, future: inner, type: 'future', operation: future };
}
