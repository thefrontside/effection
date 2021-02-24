import { Operation } from '@effection/core';
import { EventSource, addListener, removeListener } from './event-source';

/**
 * Takes an event source and event name and returns a yieldable
 * operation which resumes when the event occurs.
 */
export function once<TArgs extends unknown[] = unknown[]>(source: EventSource, eventName: string): Operation<TArgs> {
  return (task) => (resolve) => {
    let listener = (...args: unknown[]) => { resolve(args as TArgs) };
    task.ensure(() => {
      removeListener(source, eventName, listener);
    });
    addListener(source, eventName, listener);
  }
}
