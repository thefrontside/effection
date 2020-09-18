import { Task } from './task';

export type Operation<TOut> =
  ((task: Task<TOut>) => Generator<Operation<any>, TOut | undefined, any>) |
  Generator<Operation<any>, TOut | undefined, any> |
  PromiseLike<TOut> |
  undefined
