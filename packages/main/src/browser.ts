import { run, Task, Operation } from '@effection/core';

export * from './error';

export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt(); };
    try {
      window.addEventListener('unload', interrupt);
      return yield operation;
    } catch(e) {
      if(e.name === 'EffectionMainError') {
        if(e.options.message) {
          console.error(e.options.message);
        }
        if(e.options.verbose) {
          console.error(e.stack);
        }
      } else {
        console.error(e);
        throw e;
      }
    } finally {
      window.removeEventListener('beforeunload', interrupt);
    }
  }, { labels: { name: "main", platform: "browser" } });
}
