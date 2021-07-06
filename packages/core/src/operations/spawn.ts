import { Operation, Resource } from '../operation';
import type { Task, TaskOptions } from '../task';

interface Spawn<T> extends Resource<Task<T>> {
  within(scope: Task): Resource<Task<T>>;
}

export function spawn<T>(operation?: Operation<T>, options?: TaskOptions): Spawn<T> {
  function* init(scope: Task) {
    return scope.run(operation, options);
  }

  function within(scope: Task) {
    return {
      init: () => init(scope)
    }
  }

  return { init, within, name: 'spawn' };
}
