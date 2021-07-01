import { Controller } from './controller';
import { Task } from '../task';
import { createFuture } from '../future';

export function createPromiseController<TOut>(task: Task<TOut>, promise: PromiseLike<TOut>): Controller<TOut> {
  let { resolve, future } = createFuture<TOut>();

  function start() {
    Promise.race([promise, future]).then(
      (value) => {
        resolve({ state: 'completed', value });
      },
      (error) => {
        resolve({ state: 'errored', error });
      }
    )
  }

  function halt() {
    resolve({ state: 'halted' });
  }

  return { start, halt, future, type: 'promise', operation: promise };
}
