import { Controller } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task, getControls } from '../task';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>): Controller<TOut> {
  let controls = getControls(task);
  let delegate: Controller<TOut>;
  let { resourceScope } = task.options;

  function start() {
    if(!resourceScope) {
      throw new Error('cannot spawn resource in task which has no resource scope')
    }
    let init;
    try {
      init = resource.init(resourceScope, task);
    } catch(error) {
      controls.reject(error);
      return;
    }
    delegate = createIteratorController(task, init, { resourceScope });
    delegate.start();
  }

  function halt() {
    delegate.halt();
  }

  return { start, halt };
}
