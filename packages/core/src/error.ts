import type { Task } from './task';
import type { Labels } from './labels';

export interface TaskInfo {
  id: number;
  type: string;
  labels: Labels;
}

export interface HasEffectionTrace {
  effectionTrace: TaskInfo[];
}

export function addTrace(error: Error & Partial<HasEffectionTrace>, task: Task): Error & HasEffectionTrace {
  let info: TaskInfo = {
    id: task.id,
    type: task.type,
    labels: task.labels,
  };

  let properties = Object.getOwnPropertyDescriptors(error);
  properties.effectionTrace = {
    value: [...(error.effectionTrace || []), info],
    enumerable: true,
  }
  return Object.create(Object.getPrototypeOf(error), properties);
}
