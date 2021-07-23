import { run, withLabels, Task, Operation } from '@effection/core';
import { isMainError } from './error';

export * from './error';

export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt() };
    try {
      window.addEventListener('unload', interrupt);
      return yield withLabels(operation, {
        name: operation?.name || 'entry point'
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
