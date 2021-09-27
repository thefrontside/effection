/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Operation } from '../operation';
import type { Task } from '../task';
import { withLabels } from '../labels';
import { spawn } from './spawn';

type All<T extends Operation<any>[]> = {
  [P in keyof T]: T[P] extends Operation<infer TArg> ? TArg : never;
}

/**
 * Block and wait for all of the given operations to complete. Returns an array of
 * values that the given operations evaluated to. This has the same purpose as
 * [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
 *
 * If any of the operations become errored, then `all` will also become errored.
 *
 * ### Example
 *
 * ```typescript
 * import { main, all, fetch } from 'effection';
 *
 * main(function*() {
 *  let [google, bing] = yield all([fetch('http://google.com').text(), fetch('http://bing.com').text()]);
 *  // ...
 * });
 * ```
 *
 * @typeParam T the type of the array of options, this can a heterogenous array
 * @param operations a list of operations to wait for
 * @returns the list of values that the operations evaluate to, in the order they were given
 */
export function all<T extends Operation<any>[]>(operations: T): Operation<All<T>> {
  return withLabels(function*(task) {
    let tasks: Task<unknown>[] = [];
    let results: unknown[] = [];
    try {
      yield function*() {
        for (let operation of operations) {
          tasks.push(yield spawn(operation, { scope: task.options.scope }));
        }
        for (let task of tasks) {
          results.push(yield task);
        }
      };
    } catch(err) {
      for (let task of tasks) {
        task.halt();
      }
      throw(err);
    }
    return results as All<T>;
  }, { name: 'all', count: operations.length });
}
