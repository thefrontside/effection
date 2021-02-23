import { Task } from '../task';

export interface Controller<TOut> {
  start(task: Task<TOut>): void;
  halt(): void;
}
