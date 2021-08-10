import { Operation, Resource } from '../operation';
import type { Task, TaskOptions } from '../task';

interface Spawn<T> extends Resource<Task<T>> {
  within(scope: Task): Operation<Task<T>>;
}

export function spawn<T>(operation?: Operation<T>, options?: TaskOptions): Spawn<T> {
  function* init(scope: Task) {
    return scope.run(operation, options);
  }

  function within(scope: Task) {
    return scope.spawn(operation, options);
  }

  return { init, within, name: 'spawn' };
}
