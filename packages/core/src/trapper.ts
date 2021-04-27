import { Task } from './task';

export interface Trapper {
  (task: Task): void;
}
