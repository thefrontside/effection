import { Operation } from 'effection';
import { EventSource, addListener, removeListener } from './event-source';

/**
 * Takes an event source and event name and returns a yieldable
 * operation which resumes when the event occurs.
 */
export function *once(source: EventSource, eventName: string): Operation<void> {
   // eslint-disable-next-line @typescript-eslint/no-empty-function
  let onceListener = () => {};
  try {
    return yield new Promise((resolve) => {
      onceListener = (...args: unknown[]) => resolve(args);
      addListener(source, eventName, onceListener);
    });
  } finally {
    removeListener(source, eventName, onceListener);
  }
}
