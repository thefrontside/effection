import { EventSource } from './event-source';
import { Operation, spawn } from 'effection';
import { once } from './once';

export function throwOnErrorEvent(source: EventSource): Operation<void> {
  return spawn(function*() {
    let [error]: [Error] = yield once(source, 'error');
    throw error;
  });
}
