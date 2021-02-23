import { Task } from '../task';

export interface Controller<TOut> {
  start(): void;
  halt(): void;
}
