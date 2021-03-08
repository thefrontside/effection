import { createStream, Stream } from '@effection/subscription';

import { EventSource, addListener, removeListener } from './event-source';

export function on<T extends Array<unknown> = unknown[]>(source: EventSource, name: string): Stream<T, void> {
  return createStream((publish) => function*() {
    let listener = (...args: T) => publish(args);
    try {
      addListener(source, name, listener);
      yield;
    } finally {
      removeListener(source, name, listener);
    }
  });
}
