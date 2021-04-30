import { Controller } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task, getControls } from '../task';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>): Controller<TOut> {
  let controls = getControls(task);
  let delegate: Controller<TOut>;
  let { parent } = controls.options;

  function start() {
    if(!parent) {
      throw new Error('cannot spawn resource in task which has no parent')
    }
    let init;
    try {
      init = resource.init(parent);
    } catch(error) {
      controls.reject(error);
      return;
    }
    delegate = createIteratorController(task, init, { resourceTask: parent });
    delegate.start();
  }

  function halt() {
    delegate.halt();
  }

  return { start, halt };
}
