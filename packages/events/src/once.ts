import { Operation } from '@effection/core';
import { EventSource, addListener, removeListener } from './event-source';

/**
 * Takes an event source and event name and returns a yieldable
 * operation which resumes when the event occurs.
 */
export function once<TArgs extends unknown[] = unknown[]>(source: EventSource, eventName: string): Operation<TArgs> {
  return () => (resolve) => {
    let listener = (...args: unknown[]) => { resolve(args as TArgs) };
    addListener(source, eventName, listener);
    return () => {
      removeListener(source, eventName, listener);
    }
  }
}
