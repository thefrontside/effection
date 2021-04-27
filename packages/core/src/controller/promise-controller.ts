import { Controller } from './controller';
import { Task, getControls } from '../task';
import { Deferred } from '../deferred';

const HALT = Symbol("halt");

export function createPromiseController<TOut>(task: Task<TOut>, promise: PromiseLike<TOut>): Controller<TOut> {
  let controls = getControls(task);
  let haltSignal = Deferred<typeof HALT>();

  function start() {
    Promise.race([promise, haltSignal.promise]).then(
      (value) => {
        if(value === HALT) {
          controls.halted();
        } else {
          controls.resolve(value);
        }
      },
      (error) => {
        controls.reject(error);
      }
    )
  }

  function halt() {
    haltSignal.resolve(HALT);
  }

  return { start, halt };
}
