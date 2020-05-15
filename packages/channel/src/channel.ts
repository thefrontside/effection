import { resource, Operation } from 'effection';
import { EventEmitter } from 'events';

import { on, EventSource, Subscription as EventSubscription } from '@effection/events';

import { Subscription, FilterChannel, MapChannel, Mapper, Predicate } from './index';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer I>
    ? Array<DeepPartial<I>>
    : DeepPartial<T[P]>
};

function matcher<T>(reference: DeepPartial<T>): (value: T) => boolean {
  return (value: T) => {
    if(typeof(value) === 'object') {
      let casted = value as Record<string, any>;
      return Object.entries(reference).every(([key, ref]) => matcher(ref)(casted[key]));
    } else {
      return value === reference;
    }
  };
}

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

  match(reference: DeepPartial<T>): FilterChannel<T> {
    return new FilterChannel(this, matcher(reference));
  }
}
