import { run, Task, Operation } from '@effection/core';

export * from './error';

export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt(); };
    try {
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', interrupt);
      return yield operation;
    } catch(e) {
      if(e.name === 'EffectionMainError') {
        if(e.options.message) {
          console.error(e.options.message);
        }
        if(e.options.verbose) {
          console.error(e.stack);
        }
        process.exit(e.options.exitCode || -1);
      } else {
        console.error(e);
        process.exit(1);
      }
    } finally {
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
    }
  }, { labels: { name: "main", platform: "node" } });
}
