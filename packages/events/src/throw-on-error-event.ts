import { Task } from '@effection/core';
import { once } from './once';
import { EventSource } from './event-source';

export function throwOnErrorEvent(task: Task, source: EventSource): Task {
  return task.spawn(function*() {
    let error: Error = yield once(source, 'error');
    throw error;
  });
}
