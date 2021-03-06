import type { Task } from '../task';
import type { Operation } from '../operation';
import { isResource, isResolution, isFuture, isPromise, isGenerator } from '../predicates';
import { createFunctionController } from './function-controller';
import { createSuspendController } from './suspend-controller';
import { createPromiseController } from './promise-controller';
import { createIteratorController } from './iterator-controller';
import { createResolutionController } from './resolution-controller';
import { createFutureController } from './future-controller';
import { createResourceController } from './resource-controller';
import { Future } from '../future';

export interface Controller<TOut> {
  type: string;
  operation: Operation<TOut>;
  start(): void;
  halt(): void;
  future: Future<TOut>;
}

export type Options = {
  resourceScope?: Task;
  onYieldingToChange?: (task: Task | undefined) => void;
}

export function createController<T>(task: Task<T>, operation: Operation<T>, options: Options = {}): Controller<T> {
  if (typeof(operation) === 'function') {
    return createFunctionController(task, operation, () => createController(task, operation(task), options));
  } else if(!operation) {
    return createSuspendController();
  } else if (isResource(operation)) {
    return createResourceController(task, operation);
  } else if (isFuture<T>(operation)) {
    return createFutureController(task, operation);
  } else if (isResolution<T>(operation)) {
    return createResolutionController(task, operation);
  } else if(isPromise(operation)) {
    return createPromiseController(task, operation);
  } else if (isGenerator(operation)) {
    return createIteratorController(task, operation, options);
  }

  throw new Error(`unkown type of operation: ${operation}`);
}
