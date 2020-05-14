import { resource, Operation } from 'effection';
import { EventEmitter } from 'events';

import { on, EventSource, Subscription as EventSubscription } from '@effection/events';

import { Subscription, FilterChannel, MapChannel, Mapper, Predicate } from './index';

export abstract class Channel<T> {
  abstract subscribe(): Operation<Subscription<T>>;

  *once(): Operation<T> {
    let subscription: Subscription<T> = yield this.subscribe();
    return yield subscription.next();
  }

  filter(predicate: Predicate<T>): FilterChannel<T> {
    return new FilterChannel(this, predicate);
  }

  map<R>(mapper: Mapper<T, R>): MapChannel<T, R> {
    return new MapChannel(this, mapper);
  }
}
