import type { Task } from './task';
import type { Labels } from './labels';

interface TaskInfo {
  id: number;
  type: string;
  labels: Labels;
}

export class EffectionError extends Error {
  name = 'EffectionError';

  static wrap(error: Error, task: Task): EffectionError {
    let info: TaskInfo = {
      id: task.id,
      type: task.type,
      labels: task.labels,
    };
    if(error instanceof EffectionError) {
      return new EffectionError(error.source, [...error.trace, info]);
    } else {
      return new EffectionError(error, [info]);
    }
  }

  constructor(public source: Error, public trace: TaskInfo[]) {
    super(source.message);
  }
}

export function isEffectionError(error: Error): error is EffectionError {
  return error.name === 'EffectionError';
}

export function unwrapError(error: Error): Error {
  if(isEffectionError(error)) {
    return error.source;
  } else {
    return error;
  }
}
