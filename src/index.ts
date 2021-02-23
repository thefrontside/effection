import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { HaltError } from './halt-error';

export { Task, TaskOptions } from './task';
export { Operation } from './operation';
export { sleep } from './sleep';

export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  let task = new Task(operation, options);
  task.start();
  return task;
}
