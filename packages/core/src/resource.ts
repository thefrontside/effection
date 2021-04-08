import { Task, Operation } from './index';

export interface Resource<TOut> {
  use(scope: Task): Operation<TOut>;
}

export interface ResourceTask<TOut> extends Promise<TOut> {
  task: Task;
  initTask: Task<TOut>;
  halt(): Promise<void>;
}
