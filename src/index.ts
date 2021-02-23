import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { HaltError } from './halt-error';
import { Effection } from './effection';

export { Task, TaskOptions } from './task';
export { Operation } from './operation';
export { sleep } from './sleep';
export { Effection } from './effection';

export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  return Effection.root.spawn(operation, options);
}
