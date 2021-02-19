import { Task } from './task';

export type OperationIterator<TOut> = Generator<Operation<any>, TOut | undefined, any>;

export type OperationFunction<TOut> = (task: Task<TOut>) => PromiseLike<TOut> | OperationIterator<TOut>;

export type Operation<TOut> = OperationFunction<TOut> | PromiseLike<TOut> | undefined
