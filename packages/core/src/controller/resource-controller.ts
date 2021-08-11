import { Controller, Options } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>, options: Options): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { scope } = task.options;
  let { produce, future } = createFuture<TOut>();

  function start() {
    if(!scope) {
      throw new Error('cannot spawn resource in task which has no resource scope');
    }
    let init;
    try {
      init = resource.init(scope, task);
    } catch(error) {
      produce({ state: 'errored', error });
      return;
    }
    let name = resource.name || resource.labels?.name || 'resource';
    let resourceTask = scope.run(undefined, { labels: { name, type: 'resource' } });
    delegate = createIteratorController(task, init, { resourceTask, runLoop: options.runLoop });
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
