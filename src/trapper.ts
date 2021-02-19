import { Task } from './task';

export interface Trapper {
  trapChildExit(task: Task): void;
}
