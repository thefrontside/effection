import { Controller, Options } from './controller';
import { createIteratorController } from './iterator-controller';
import { Resource } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>, options: Options): Controller<TOut> {
  let delegate: Controller<TOut>;
  let resourceTask: Task;
  let { scope } = task.options;
  let { produce, future } = createFuture<TOut>();

  function start() {
    if(!scope) {
      throw new Error('cannot spawn resource in task which has no resource scope');
    }

    let name = resource.name || resource.labels?.name || 'resource';

    resourceTask = scope.run(undefined, { labels: { name, type: 'resource' } });

    let iterator;
    try {
      iterator = resource.init(resourceTask, task);
    } catch(error) {
      produce({ state: 'errored', error });
      return;
    }
    delegate = createIteratorController(task, iterator, { resourceTask, runLoop: options.runLoop });
    delegate.future.consume((value) => {
      produce(value);
    });
    delegate.start();
  }

  function halt() {
    delegate.halt();
  }

  return {
    type: 'resource',
    start,
    halt,
    future,
    get resourceTask() {
      return resourceTask;
    },
    operation: resource
  };
}
