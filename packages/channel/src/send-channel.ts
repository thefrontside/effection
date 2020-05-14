import { resource, Operation } from 'effection';
import { EventEmitter } from 'events';

import { on } from '@effection/events';

import { Channel, Subscription } from './index';

export class SendChannelSubscription<T> implements Subscription<T> {
  private subscription?: Subscription<[T]>;

  constructor(private bus: EventEmitter) {}

  *next(): Operation<T> {
    if(!this.subscription) { throw new Error("subscription not running"); }
    let [value] = yield this.subscription.next();
    return value;
  }

  *run(): Operation<void> {
    this.subscription = yield on(this.bus, 'message');
    yield;
  }
}

export class SendChannel<T> extends Channel<T> {
  private bus = new EventEmitter();

  setMaxListeners(value: number) {
    this.bus.setMaxListeners(value);
  }

  send(message: T) {
    this.bus.emit('message', message);
  }

  *subscribe(): Operation<SendChannelSubscription<T>> {
    let subscription = new SendChannelSubscription<T>(this.bus);
    return yield resource(subscription, subscription.run());
  }
}
