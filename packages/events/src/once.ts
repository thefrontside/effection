import { Operation } from 'effection';
import { EventSource, addListener, removeListener } from './event-source';

/**
 * Takes an event source and event name and returns a yieldable
 * operation which resumes when the event occurs.
 */
export function once(source: EventSource, eventName: string): Operation {
  return ({ resume, ensure }) => {
    let listener = (...args: unknown[]) => resume(args);
    ensure(() => removeListener(source, eventName, listener));

    addListener(source, eventName, listener);
  };
}
