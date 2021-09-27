import { Operation } from '../operation';
import { Future } from '../future';

/**
 * Run the given function or operation when the current task shuts down. This
 * is equivalent to running the function or operation in a finally block, but
 * it can help you avoid rightward drift.
 *
 * ### Example using function
 *
 * Using a function:
 *
 * ```typescript
 * import { main, ensure } from 'effection';
 * import { createServer } from 'http';
 *
 * main(function*() {
 *   let server = createServer(...);
 *   yield ensure(() => { server.close() });
 * });
 * ```
 *
 * Note that you should wrap the function body in braces, so the function
 * returns `undefined`.
 *
 * ### Example using operation
 *
 * ```typescript
 * import { main, ensure, once } from 'effection';
 * import { createServer } from 'some-library';
 *
 * main(function*() {
 *   let server = createServer(...);
 *   yield ensure(function*() {
 *     server.close();
 *     yield once(server, 'closed');
 *   });
 * });
 * ```
 *
 * Here we're using some library where server shutdown is asynchronous, we can
 * block and wait for the shutdown to complete inside of ensure by using an
 * operation.
 *
 * @param fn a function which returns an operation or void
 */
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

    return Future.resolve(undefined);
  };
}
