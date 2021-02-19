import { Operation } from './operation';
import { Task } from './task';
import { HaltError } from './halt-error';

export { Task } from './task';
export { Operation } from './operation';
export { sleep } from './sleep';

export function run<TOut>(operation?: Operation<TOut>): Task<TOut> {
  let task = new Task(operation);
  task.start();
  return task;
}
