import { Operation, Resource } from '../operation';
import { Task } from '../task';

export function spawn<T>(operation?: Operation<T>): Resource<Task<T>> {
  return {
    *init(scope) {
      return scope.spawn(operation);
    }
  }
}
