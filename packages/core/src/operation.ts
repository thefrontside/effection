/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task } from './task';

export type OperationIterator<TOut> = Generator<Operation<any>, TOut | undefined, any>;

export interface OperationResolution<TOut> {
  perform(resolve: (value: TOut) => void, reject: (err: Error) => void): void | (() => void);
};

export type Continuation<TOut> = PromiseLike<TOut> | OperationIterator<TOut> | OperationResolution<TOut> | undefined;

export type ContinuationFunction<TOut> = (task: Task<TOut>) => Continuation<TOut>;

export type Operation<TOut> = Continuation<TOut> | ContinuationFunction<TOut>;
