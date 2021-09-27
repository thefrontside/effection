import type { Task, TaskInfo } from './task';

/**
 * @hidden
 */
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

  return Object.create(error, {
    effectionTrace: {
      value: [...(error.effectionTrace || []), info],
      enumerable: true,
    }
  });
}
