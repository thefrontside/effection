import type { Task, TaskInfo } from './task';

export interface HasEffectionTrace {
  effectionTrace: TaskInfo[];
}

export function addTrace(error: Error & Partial<HasEffectionTrace>, task: Task): Error & HasEffectionTrace {
  let info: TaskInfo = {
    id: task.id,
    type: task.type,
    labels: task.labels,
    state: task.state,
  };

  let properties = Object.getOwnPropertyDescriptors(error);
  properties.effectionTrace = {
    value: [...(error.effectionTrace || []), info],
    enumerable: true,
  };
  return Object.create(Object.getPrototypeOf(error), properties);
}
