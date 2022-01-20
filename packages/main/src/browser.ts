import { run, withLabels, Task, Operation } from '@effection/core';
import { isMainError } from './error';

export * from './error';

export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt() };
    try {
      window.addEventListener('unload', interrupt);
      let name = operation?.name || 'entry point';
      return yield withLabels(operation, {
        name: typeof name == 'string' ? name : 'entry point'
      });
    } catch(error) {
      if(isMainError(error)) {
        if(error.message) {
          console.error(error.message);
        }
      } else {
        console.error(error);
        throw error;
      }
    } finally {
      window.removeEventListener('unload', interrupt);
    }
  }, { labels: { name: "main", platform: "browser" } });
}
