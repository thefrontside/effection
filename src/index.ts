import { Operation } from './operation';
import { Task } from './task';
import { HaltError } from './halt-error';

export function run<TOut>(operation: Operation<TOut>): Task<TOut> {
  let task = new Task(operation);
  task.then((value) => value, (error) => {
    if(!(error instanceof HaltError)) {
      console.error(error);
    }
  });
  return task;
}
