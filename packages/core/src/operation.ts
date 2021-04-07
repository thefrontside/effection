/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task } from './task';

export type OperationIterator<TOut> = Generator<Operation<any>, TOut | undefined, any>;

export type OperationResolution<TOut> = (resolve: (value: TOut) => void, reject: (error: Error) => void) => void;

export type OperationFunction<TOut> = (task: Task<TOut>) => PromiseLike<TOut> | OperationIterator<TOut> | OperationResolution<TOut>;

export type Operation<TOut> = OperationFunction<TOut> | PromiseLike<TOut> | undefined

export type Resource<TOut> = {
  use(scope: Task): Operation<TOut>;
}

export type Spawnable<TOut> = Operation<TOut> | Resource<TOut>;

export function isResource<TOut>(value: any): value is Resource<TOut> {
  return typeof(value) === 'object' && typeof(value.use) === 'function';
}
