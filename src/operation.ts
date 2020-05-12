import { Task } from './task';

export type Operation<TOut> =
  ((task: Task<TOut>) => Iterator<Operation<unknown>, TOut, any>) |
  Iterator<Operation<unknown>, TOut, any> |
  PromiseLike<TOut> |
  undefined
