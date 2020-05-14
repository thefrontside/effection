import { Operation, spawn, fork, resource } from 'effection';
import { EventEmitter } from 'events';

import { Channel, Subscription } from './index';

import { on, EventSource } from '@effection/events';

export class EventChannel extends Channel<unknown[]> {
  constructor(private emitter: EventSource, private eventName: string) {
    super();
  }

  *subscribe(): Operation<Subscription<unknown[]>> {
    return yield on(this.emitter, this.eventName);
  }
}
