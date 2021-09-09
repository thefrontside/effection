/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Operation } from '../operation';
import type { Task } from '../task';
import { withLabels } from '../labels';
import { spawn } from './spawn';

type All<T extends Operation<any>[]> = {
  [P in keyof T]: T[P] extends Operation<infer TArg> ? TArg : never;
}

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
