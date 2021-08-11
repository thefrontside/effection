import { Operation } from '../operation';
import { createFuture } from '../future';

export function ensure<T>(fn: () => Operation<T> | void): Operation<undefined> {
  return function ensure(task) {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `ensure` on a task without scope');
    }
    scope.run(function* ensureHandler() {
      try {
        yield;
      } finally {
        let result = fn();
        if(result) {
          yield result;
        }
      }
    });

    let { future, produce } = createFuture<undefined>();
    produce({ state: 'completed', value: undefined });
    return future;
  };
}
