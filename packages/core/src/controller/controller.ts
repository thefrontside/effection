import type { Task } from '../task';
import type { Operation } from '../operation';
import { isResolution, isPromise, isGenerator } from '../predicates';
import { createFunctionController } from './function-controller';
import { createSuspendController } from './suspend-controller';
import { createPromiseController } from './promise-controller';
import { createIteratorController } from './iterator-controller';
import { createResolutionController } from './resolution-controller';

export interface Controller<TOut> {
  start(task: Task<TOut>): void;
  halt(): void;
}

export function createController<T>(task: Task<T>, operation: Operation<T>): Controller<T> {
  if (typeof(operation) === 'function') {
    return createFunctionController(task, () => createController(task, operation(task)));
  } else if(!operation) {
    return createSuspendController(task);
  } else if (isResolution(operation)) {
    return createResolutionController(task, operation);
  } else if(isPromise(operation)) {
    return createPromiseController(task, operation);
  } else if (isGenerator(operation)) {
    return createIteratorController(task, operation);
  }

  throw new Error(`unkown type of operation: ${operation}`);
}
