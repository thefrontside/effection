import { run, withLabels, Task, Operation } from '@effection/core';
import { formatError } from './format-error-node';
import { isMainError } from './error';

export * from './error';

export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt() };
    try {
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', interrupt);
      return yield withLabels(operation, {
        name: operation?.name || 'entry point'
      });
    } catch(error) {
      console.error(formatError(error));
      if(isMainError(error)) {
        process.exit(error.exitCode || -1);
      } else {
        process.exit(1);
      }
    } finally {
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
    }
  }, { labels: { name: "main", platform: "node" } });
}
