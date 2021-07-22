import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResolutionController<TOut>(task: Task<TOut>, resolution: OperationResolution<TOut>): Controller<TOut> {
  let { future, produce } = createFuture<TOut>();

  function start() {
    try {
      let atExit = resolution.perform(
        (value) => produce({ state: 'completed', value }),
        (error) => produce({ state: 'errored', error }),
      );

      if (atExit) {
        task.consume(atExit);
      }
    } catch(error) {
      produce({ state: 'errored', error });
    }
  }

  function halt() {
    produce({ state: 'halted' });
  }

  return { start, halt, future, type: 'resolution', operation: resolution };
}
