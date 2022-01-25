import type { Task } from '../task';
import type { RunLoop } from '../run-loop';
import { Operation } from '../operation';
import { isResource, isFuture, isPromise, isGenerator, isObjectOperation } from '../predicates';
import { createDelegateController } from './delegate-controller';
import { createSuspendController } from './suspend-controller';
import { createPromiseController } from './promise-controller';
import { createIteratorController } from './iterator-controller';
import { createFutureController } from './future-controller';
import { createResourceController } from './resource-controller';
import { Future } from '../future';
import { Symbol } from '../symbol';

export interface Controller<TOut> {
  type: string;
  operation: Operation<TOut>;
  resourceTask?: Task;
  start(): void;
  halt(): void;
  future: Future<TOut>;
}

export type Options = {
  runLoop: RunLoop;
  onYieldingToChange?: (task: Task | undefined) => void;
}

export function createController<T>(task: Task<T>, operation: Operation<T>, options: Options): Controller<T> {
  if (isObjectOperation<T>(operation)) {
    return createDelegateController(task, operation, () => createController(task, operation[Symbol.operation], options));
  } else if (typeof(operation) === 'function') {
    return createDelegateController(task, operation, () => createController(task, operation(task), options));
  } else if(!operation) {
    return createSuspendController();
  } else if (isResource(operation)) {
    return createResourceController(task, operation);
  } else if (isFuture<T>(operation)) {
    return createFutureController(task, operation);
  } else if(isPromise(operation)) {
    return createPromiseController(task, operation);
  } else if (isGenerator(operation)) {
    return createIteratorController(task, operation, options);
  } else {
    return createFutureController(task, Future.reject(new Error(`unkown type of operation: ${operation}`)));
  }
}
