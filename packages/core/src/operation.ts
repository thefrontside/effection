import { Task } from './task';

export type OperationIterator<TOut> = Generator<Operation<any>, TOut | undefined, any>;

export type OperationResolution<TOut> = (resolve: (value: TOut) => void, reject: (error: Error) => void) => void;

export type OperationFunction<TOut> = (task: Task<TOut>) => PromiseLike<TOut> | OperationIterator<TOut> | OperationResolution<TOut>;

export type Operation<TOut> = OperationFunction<TOut> | PromiseLike<TOut> | undefined
