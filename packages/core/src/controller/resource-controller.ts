import { Controller } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { resourceScope } = task.options;
  let { resolve, future } = createFuture<TOut>();

  function start() {
    if(!resourceScope) {
      throw new Error('cannot spawn resource in task which has no resource scope')
    }
    let init;
    try {
      init = resource.init(resourceScope, task);
    } catch(error) {
      resolve({ state: 'errored', error });
      return;
    }
    delegate = createIteratorController(task, init, { resourceScope });
    delegate.future.consume((value) => {
      resolve(value);
    });
    delegate.start();
  }

  function halt() {
    delegate.halt();
  }

  return { start, halt, future, type: 'resource' };
}
