import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResolutionController<TOut>(task: Task<TOut>, resolution: OperationResolution<TOut>): Controller<TOut> {
  let { future, resolve } = createFuture<TOut>();

  function start() {
    try {
      let atExit = resolution.perform(
        (value) => resolve({ state: 'completed', value }),
        (error) => resolve({ state: 'errored', error }),
      );

      if (atExit) {
        task.future.consume(atExit);
      }
    } catch(error) {
      resolve({ state: 'errored', error });
    }
  }

  function halt() {
    resolve({ state: 'halted' });
  }

  return { start, halt, future, type: 'resolution' };
}
