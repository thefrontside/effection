/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Operation } from '../operation';
import type { Task } from '../task';

type All<T extends Operation<any>[]> = {
  [P in keyof T]: T[P] extends Operation<infer TArg> ? TArg : never;
}

export function all<T extends Operation<any>[]>(operations: T): Operation<All<T>> {
  return function*(scope) {
    let tasks: Task<unknown>[] = [];
    let results: unknown[] = [];
    for (let operation of operations) {
      if(scope.state === 'running') {
        tasks.push(scope.spawn(operation));
      }
    }
    for (let task of tasks) {
      results.push(yield task);
    }
    return results as All<T>;
  };
}
