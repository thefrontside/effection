import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Task, getControls } from '../task';
import { createFuture } from '../future';

export function createResolutionController<TOut>(task: Task<TOut>, resolution: OperationResolution<TOut>): Controller<TOut> {
  let { future, resolve } = createFuture<TOut>();
  let controls = getControls(task);

  function start() {
    try {
      let atExit = resolution.perform(
        (value) => resolve({ state: 'completed', value }),
        (error) => resolve({ state: 'errored', error }),
      );

      if (atExit) {
        controls.future.consume(atExit);
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
