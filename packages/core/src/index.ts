import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { Effection } from './effection';

export { State, StateTransition } from './state-machine';
export { createTask, Task, TaskOptions, Controls, getControls } from './task';
export { Operation, Resource } from './operation';
export { Effection } from './effection';
export { deprecated } from './deprecated';
export { Deferred } from './deferred';

export { sleep } from './operations/sleep';
export { ensure } from './operations/ensure';
export { timeout } from './operations/timeout';
export { withTimeout } from './operations/with-timeout';
export { spawn } from './operations/spawn';

export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  return Effection.root.spawn(operation, options);
}
