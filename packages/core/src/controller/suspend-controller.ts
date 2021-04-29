import { Controller } from './controller';
import { getControls, Task } from '../task';

export function createSuspendController<TOut>(task: Task<TOut>): Controller<TOut> {
  let controls = getControls(task);

  function start() {
    // no op
  }

  function halt() {
    controls.halted();
  }

  return { start, halt };
}
