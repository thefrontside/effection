import { Operation } from 'effection';
import { ChainableSubscription } from './chainable-subscription';
import { SubscriptionSource } from './subscription-source';
import { makeChainable, ChainableSubscribable } from './chainable-subscribable';

export function subscribe<T, TReturn>(source: SubscriptionSource<T,TReturn>): Operation<ChainableSubscription<T, TReturn>> & ChainableSubscribable<T,TReturn> {
  return makeChainable(function*() { return yield ChainableSubscription.of(source) });
}
