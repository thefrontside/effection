import { Operation, Resource } from '../operation';
import { Task } from '../task';

interface Spawn<T> extends Resource<Task<T>> {
  within(scope: Task): Resource<Task<T>>;
}

export function spawn<T>(operation?: Operation<T>): Spawn<T> {
  function* init(scope: Task) {
    return scope.spawn(operation);
  }

  function within(scope: Task) {
    return {
      init: () => init(scope)
    }
  }

  return { init, within };
}
