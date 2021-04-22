import type { Controls, Task } from '../task';
import type { Operation } from '../operation';
import { isResolution, isPromise, isGenerator } from '../predicates';
import { FunctionController } from './function-controller';
import { SuspendController } from './suspend-controller';
import { PromiseController } from './promise-controller';
import { IteratorController } from './iterator-controller';
import { ResolutionController } from './resolution-controller';

export interface Controller<TOut> {
  start(task: Task<TOut>): void;
  halt(): void;
}

export function createController<T>(task: Task<T>, controls: Controls<T>, operation: Operation<T>): Controller<T> {
  if (typeof(operation) === 'function') {
    return new FunctionController(controls, () => createController(task, controls, operation(task)));
  } else if(!operation) {
    return new SuspendController(controls);
  } else if (isResolution(operation)) {
    return new ResolutionController(controls, operation);
  } else if(isPromise(operation)) {
    return new PromiseController(controls, operation);
  } else if (isGenerator(operation)) {
    return new IteratorController(controls, operation);
  }

  throw new Error(`unkown type of operation: ${operation}`);
}
