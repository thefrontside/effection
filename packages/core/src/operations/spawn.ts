import { Operation, OperationFunction } from '../operation';
import { Future } from '../future';
import type { Task, TaskOptions } from '../task';

interface Spawn<T> extends OperationFunction<Task<T>> {
  within(scope: Task): Operation<Task<T>>;
}

export function spawn<T>(operation?: Operation<T>, options?: TaskOptions): Spawn<T> {
  function spawn(task: Task) {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `spawn` on a task without scope');
    }
    let result = scope.run(operation, options);
    return Future.resolve(result);
  }

  function within(scope: Task) {
    return scope.spawn(operation, options);
  }

  return Object.assign(spawn, { within });
}
