import { Operation, spawn, fork, resource } from 'effection';
import { EventEmitter } from 'events';
import { Channel, Subscription } from './index';

export type Mapper<P, T> = ((value: P) => T);

export class MapChannelSubscription<P, T> implements Subscription<T> {
  private subscription?: Subscription<P>;

  constructor(private parent: Channel<P>, private mapper: Mapper<P, T>) {}

  *next(): Operation<T> {
    if(!this.subscription) { throw new Error("subscription not running"); }
    let value: P = yield this.subscription.next();
    return this.mapper(value);
  }

  *run(): Operation<void> {
    this.subscription = yield this.parent.subscribe();
    yield;
  }
}

export class MapChannel<P, T> extends Channel<T> {
  private bus = new EventEmitter();

  constructor(private parent: Channel<P>, private mapper: Mapper<P, T>) {
    super();
  }

  *subscribe(): Operation<MapChannelSubscription<P, T>> {
    let subscription = new MapChannelSubscription<P, T>(this.parent, this.mapper);
    return yield resource(subscription, subscription.run());
  }
}

