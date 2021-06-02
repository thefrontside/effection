import { Task, getControls } from '../task';
import { Controller } from './controller';

export function createFunctionController<TOut>(task: Task<TOut>, createController: () => Controller<TOut>) {
  let delegate: Controller<TOut>;
  let controls = getControls(task);

  function start() {
    try {
      delegate = createController();
    } catch (error) {
      controls.reject(error);
      return;
    }
    delegate.start();
  }

  function halt() {
    if (!delegate) {
      throw new Error(`EFFECTION INTERNAL ERROR halt() called before start()`);
    }
    delegate.halt();
  }

  return {
    get type() {
      if(delegate) {
        return delegate.type === 'promise' ? 'async function' : `${delegate.type} function`;
      } else {
        return 'function';
      }
    },
    start,
    halt,
  }
}
