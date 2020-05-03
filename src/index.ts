import { Operation } from './operation';
import { Task } from './task';

export function run<TOut>(operation: Operation<TOut>): Task<TOut> {
  return new Task(operation);
}
