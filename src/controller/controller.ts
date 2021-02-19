import { Task } from '../task';

export interface Controller<TOut> extends Promise<TOut> {
  start(task: Task<TOut>): void;
  halt(): void;
}
