import { EventSource } from './event-source';
import { Operation, spawn } from '@effection/core';
import { once } from './once';

export function throwOnErrorEvent(source: EventSource) {
  return spawn(function*(): Operation<void> {
    let [error]: [Error] = yield once(source, 'error');
    throw error;
  });
}
