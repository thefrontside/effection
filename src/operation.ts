import { Task } from './task';

export type Operation<TOut> =
  ((task: Task<TOut>) => Generator<Operation<unknown>, TOut | undefined, any>) |
  Generator<Operation<unknown>, TOut | undefined, any> |
  PromiseLike<TOut> |
  undefined
