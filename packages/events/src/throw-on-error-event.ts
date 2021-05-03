import { Operation } from '@effection/core';
import { once } from './once';
import { EventSource } from './event-source';

export function *throwOnErrorEvent(source: EventSource): Operation<void> {
  let error: Error = yield once(source, 'error');
  throw error;
}
