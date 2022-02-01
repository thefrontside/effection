import { run, withLabels, Task, Operation } from '@effection/core';
import { formatError } from './format-error-node';
import { isMainError } from './error';

export * from './error';

/**
 * Runs the given operation in a task and returns that task. `main` functions
 * as an entry point to programs written in Effection. That means that your
 * program should only call `main` once, and everything the program does is
 * handled from within `main`. Unlike `run`, `main` automatically prints errors
 * that occurred to the console.
 *
 * Using {@link MainError}, the `main` operation can be aborted without causing
 * a stack trace to be printed to the console.
 *
 * The behaviour of `main` is slightly different depending on the environment it
 * is running in.
 *
 * ### Node
 *
 * When running within node, any error which reaches `main` causes the entire
 * process to exit with an exit code of `1`.
 *
 * Additionally, handlers for `SIGINT` and `SIGTERM` are attached to the
 * process, so that sending an exit signal to the process causes the main task
 * to become halted. This means that hitting CTRL-C on an Effection program
 * using `main` will cause an orderly shutdown and run all finally blocks and
 * ensure operations.
 *
 * ### Browser
 *
 * When running in a browser, The `main` operation gets shut down on the
 * `unload` event.
 */
export function main<T>(operation: Operation<T>): Task<T> {
  return run(function*(task) {
    let interrupt = () => { task.halt() };
    try {
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', interrupt);
      let name = operation?.name || 'entry point';
      return yield withLabels(operation, {
        name: typeof name == 'string' ? name : 'entry point'
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
