import { Operation } from './operation';
import { Task } from './task';
import { HaltError } from './halt-error';

export { Task } from './task'
export { Operation } from './operation'

export function run<TOut>(operation: Operation<TOut>): Task<TOut> {
  return new Task(operation);
}
