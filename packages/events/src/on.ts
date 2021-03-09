import { createStream, Stream } from '@effection/subscription';

import { EventSource, addListener, removeListener } from './event-source';

export function onEmit<T extends Array<unknown> = unknown[]>(source: EventSource, name: string): Stream<T, void> {
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


export function on<T = unknown>(source: EventSource, name: string): Stream<T, void> {
  return onEmit<[T]>(source, name).map(([event]) => event)
}
