import { Controller } from './controller';
import { Task } from '../task';
import { createFuture } from '../future';

export function createPromiseController<TOut>(task: Task<TOut>, promise: PromiseLike<TOut>): Controller<TOut> {
  let { produce, future } = createFuture<TOut>();

  function start() {
    Promise.race([promise, future]).then(
      (value) => {
        produce({ state: 'completed', value });
      },
      (error) => {
        produce({ state: 'errored', error });
      }
    );
  }

  function halt() {
    produce({ state: 'halted' });
  }

  return { start, halt, future, type: 'promise', operation: promise };
}
