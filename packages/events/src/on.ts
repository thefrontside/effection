import { Task } from 'effection';
import { Subscription } from '@effection/subscription';

import { EventSource, addListener, removeListener } from './event-source';

export function on<T extends Array<unknown> = unknown[]>(task: Task, source: EventSource, name: string): Subscription<T, void> {
  return Subscription.create(task, function*(publish) {
    let listener = (...args: T) => publish(args);
    try {
      addListener(source, name, listener);
      yield;
    } finally {
      removeListener(source, name, listener);
    }
  });
}
