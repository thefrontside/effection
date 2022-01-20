/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Task } from './task';
import type { Labels } from './labels';
import type { FutureLike } from './future';
import { Symbol } from './symbol';

export interface Labelled {
  name?: string;
  labels?: Labels;
}

export interface OperationGenerator<TOut> extends Generator<Operation<any>, TOut | undefined, any>, Labelled {
}

export interface OperationPromise<TOut> extends PromiseLike<TOut>, Labelled {
}

export interface OperationFuture<TOut> extends FutureLike<TOut>, Labelled {
}

/**
 * An `Resource` in Effection represents a long running computation which also
 * provides some means of interaction while it is running.
 *
 * See [the Resource guide](https://frontside.com/effection/docs/guides/resources) for more information.
 *
 */
export interface Resource<TOut> extends Labelled {
  /**
   * A resource's `init` method is called when the resource is initialized. It
   * runs inside the resource's resource task, and is able to spawn tasks and
   * other resources directly under the resource task.
   *
   * @param resourceTask a handle to the resource task that the resource is running
   * @param initTask a handle to the task of the `init` itself
   */
  init(resourceTask: Task, initTask: Task): OperationGenerator<TOut>;
}

export interface OperationFunction<TOut> extends Labelled {
  (task: Task<TOut>): Operation<TOut>;
}

export interface OperationObject<TOut> extends Record<string | symbol | number, unknown> {
  [Symbol.operation]: Operation<TOut>;
}

/**
 * An `Operation` in Effection describes an abstract computation, that is a
 * computation which is not currently running.
 *
 * See [the Task and Operations guide](https://frontside.com/effection/docs/guides/tasks) for more information.
 *
 */
export type Operation<TOut> =
  OperationPromise<TOut> |
  OperationGenerator<TOut> |
  OperationFuture<TOut> |
  OperationFunction<TOut> |
  OperationObject<TOut> |
  Resource<TOut> |
  undefined;
