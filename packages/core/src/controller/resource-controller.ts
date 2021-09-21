import { Controller } from './controller';
import { Resource } from '../operation';
import { Task } from '../task';
import { createFuture } from '../future';

export function createResourceController<TOut>(task: Task<TOut>, resource: Resource<TOut>): Controller<TOut> {
  let resourceTask: Task;
  let initTask: Task<TOut>;
  let { scope } = task.options;
  let { produce, future } = createFuture<TOut>();

  function start() {
    if(!scope) {
      throw new Error('cannot spawn resource in task which has no resource scope');
    }

    let name = resource.name || resource.labels?.name || 'resource';
    let labels = resource.labels || {};

    resourceTask = scope.run(undefined, { type: 'resource', labels: { ...labels, name } });

    initTask = resourceTask.run((task) => resource.init(resourceTask, task), {
      yieldScope: resourceTask,
      labels: { name: 'init' },
      ignoreError: true,
    });
    initTask.consume((value) => {
      if(value.state !== 'completed') {
        resourceTask.halt();
      }
      produce(value);
    });
  }

  function halt() {
    resourceTask?.halt();
  }

  return {
    type: 'resource constructor',
    start,
    halt,
    future,
    get resourceTask() {
      return resourceTask;
    },
    operation: resource
  };
}
