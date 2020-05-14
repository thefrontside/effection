import { Operation, spawn, fork, resource } from 'effection';
import { EventEmitter } from 'events';
import { Channel, Subscription } from './index';

export type Predicate<T> = ((value: T) => boolean);

export class FilterChannelSubscription<T> implements Subscription<T> {
  private subscription?: Subscription<T>;

  constructor(private parent: Channel<T>, private predicate: Predicate<T>) {}

  *next(): Operation<T> {
    if(!this.subscription) { throw new Error("subscription not running"); }
    while(true) {
      let value = yield this.subscription.next();
      if(this.predicate(value)) {
        return value;
      }
    }
  }

  *run(): Operation<void> {
    this.subscription = yield this.parent.subscribe();
    yield;
  }
}

export class FilterChannel<T> extends Channel<T> {
  private bus = new EventEmitter();

  constructor(private parent: Channel<T>, private predicate: Predicate<T>) {
    super();
  }

  *subscribe(): Operation<FilterChannelSubscription<T>> {
    let subscription = new FilterChannelSubscription(this.parent, this.predicate);
    return yield resource(subscription, subscription.run());
  }
}
