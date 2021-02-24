import { Task } from './task';

export interface Trapper {
  trap(task: Task): void;
}
