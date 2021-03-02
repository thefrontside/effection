import { createSubscribable, Subscribable } from '@effection/subscription';

import { EventSource, addListener, removeListener } from './event-source';

export function on<T extends Array<unknown> = unknown[]>(source: EventSource, name: string): Subscribable<T, void> {
  return createSubscribable((publish) => function*() {
    let listener = (...args: T) => publish(args);
    try {
      addListener(source, name, listener);
      yield;
    } finally {
      removeListener(source, name, listener);
    }
  });
}
