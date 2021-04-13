/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task } from './task';

export type OperationIterator<TOut> = Generator<Operation<any>, TOut | undefined, any>;

export interface OperationResolution<TOut> {
  perform(resolve: (value: TOut) => void, reject: (err: Error) => void): void;
};

export type OperationFunction<TOut> = (task: Task<TOut>) => PromiseLike<TOut> | OperationIterator<TOut> | OperationResolution<TOut>;

export type Operation<TOut> = OperationFunction<TOut> | PromiseLike<TOut> | OperationIterator<TOut> | undefined
