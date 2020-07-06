import { Operation } from 'effection';
import { Subscription, createSubscription, Subscriber } from './subscription';
import { DeepPartial, matcher } from './match';
import { SymbolSubscribable } from './symbol-subscribable';

export interface Subscribable<T,TReturn> {
  [SymbolSubscribable](): Operation<Subscription<T,TReturn>>;
}

export type SubscriptionSource<T,TReturn> = Subscribable<T,TReturn> | Operation<Subscription<T,TReturn>>;

export function* forEach<T,TReturn>(source: SubscriptionSource<T,TReturn>, visit: (value: T) => Operation<void>): Operation<TReturn> {
  let subscription: Subscription<T,TReturn> = yield subscribe(source);
  while (true) {
    let result: IteratorResult<T,TReturn> = yield subscription.next();
    if (result.done) {
      return result.value;
    } else {
      yield visit(result.value);
    }
  }
}

export const Subscribable = {
  from: <T,TReturn>(source: SubscriptionSource<T,TReturn>) => new Chain(source)
}

export class Chain<T, TReturn> implements Subscribable<T,TReturn> {
  constructor(private source: SubscriptionSource<T,TReturn>) {}

  [SymbolSubscribable](): Operation<Subscription<T,TReturn>> {
    return subscribe(this.source)
  }

  map<X>(fn: (value: T) => X): Chain<X,TReturn> {
    return this.chain(source => publish => forEach(source, function*(item) {
      publish(fn(item));
    }));
  }

  filter(predicate: (value: T) => boolean): Chain<T,TReturn> {
    return this.chain(source => publish => forEach(source, function*(item) {
      if (predicate(item)) {
        publish(item);
      }
    }))
  }

  match(reference: DeepPartial<T>): Chain<T,TReturn> {
    return this.filter(matcher(reference));
  }

  chain<X = T,XReturn = TReturn>(next: (source: SubscriptionSource<T,TReturn>) => Subscriber<X,XReturn>): Chain<X,XReturn> {
    return new Chain(createSubscription(next(this.source)));
  }

  forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
    return forEach(this.source, visit);
  }

  *first(): Operation<T | undefined> {
    let subscription: Subscription<T, TReturn> = yield subscribe(this.source);
    let { done, value } = yield subscription.next();
    if (done) {
      return undefined;
    } else {
      return value;
    }
  }
}

export function subscribe<T, TReturn>(source: SubscriptionSource<T,TReturn>): Operation<Subscription<T,TReturn>> {
  if (isSubscribable<T,TReturn>(source)) {
    return source[SymbolSubscribable]()
  } else {
    return source;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSubscribable<T,TReturn>(value: any): value is Subscribable<T,TReturn> {
  return !!value[SymbolSubscribable];
}
