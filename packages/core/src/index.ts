import { Operation } from './operation';
import { Task, TaskOptions } from './task';
import { Effection } from './effection';

export { State, StateTransition } from './state-machine';
export { createTask, Task, TaskOptions, TaskInfo, TaskTree } from './task';
export { Operation, Resource } from './operation';
export { Effection } from './effection';
export { deprecated } from './deprecated';
export { Labels, withLabels } from './labels';
export { HasEffectionTrace } from './error';
export { createFuture, Future, FutureLike } from './future';

export { sleep } from './operations/sleep';
export { ensure } from './operations/ensure';
export { timeout } from './operations/timeout';
export { withTimeout } from './operations/with-timeout';
export { spawn } from './operations/spawn';
export { race } from './operations/race';
export { all } from './operations/all';
export { label } from './operations/label';

export function run<TOut>(operation?: Operation<TOut>, options?: TaskOptions): Task<TOut> {
  return Effection.root.spawn(operation, options);
}
