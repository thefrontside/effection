import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Task, getControls } from '../task';

export function createResolutionController<TOut>(task: Task<TOut>, resolution: OperationResolution<TOut>): Controller<TOut> {
  let controls = getControls(task);

  function start() {
    try {
      let atExit = resolution.perform(controls.resolve, controls.reject);
      if (atExit) {
        controls.ensure(atExit);
      }
    } catch(error) {
      controls.reject(error);
    }
  }

  function halt() {
    controls.halted();
  }

  return { start, halt };
}
