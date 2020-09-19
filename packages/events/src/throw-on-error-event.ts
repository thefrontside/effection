import { EventSource } from './event-source';
import { Operation } from 'effection';
import { once } from './once';

export function throwOnErrorEvent(source: EventSource): Operation<void> {
  return function*(task) {
    task.spawn(function*() {
      let [error]: [Error] = yield once(source, 'error');
      throw error;
    });
  };
}
