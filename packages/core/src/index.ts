import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { Effection } from './effection';

export { State, StateTransition } from './state-machine';
export { createTask, Task, TaskOptions, Controls, getControls } from './task';
export { Operation, Resource } from './operation';
export { sleep } from './sleep';
export { Effection } from './effection';
export { deprecated } from './deprecated';
export { Deferred } from './deferred';

export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  return Effection.root.spawn(operation, options);
}
