import { Controller, Options } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>, options: Options): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { resourceScope } = task.options;
  let { produce, future } = createFuture<TOut>();

  function start() {
    if(!resourceScope) {
      throw new Error('cannot spawn resource in task which has no resource scope');
    }
    let init;
    try {
      init = resource.init(resourceScope, task);
    } catch(error) {
      produce({ state: 'errored', error });
      return;
    }
    delegate = createIteratorController(task, init, { resourceScope, runLoop: options.runLoop });
    delegate.future.consume((value) => {
      produce(value);
    });
    delegate.start();
  }

  function halt() {
    delegate.halt();
  }

  return { start, halt, future, type: 'resource', operation: resource };
}
