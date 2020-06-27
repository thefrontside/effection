export { Subscription, createSubscription } from './subscription';
export { SymbolSubscribable, SubscriptionSource, forEach, Subscribable } from './subscribable';
export { ChainableSubscription } from './chainable-subscription';

import { Operation } from 'effection';
import { ChainableSubscription } from './chainable-subscription';
import { SubscriptionSource } from './subscribable';

export function* subscribe<T, TReturn>(source: SubscriptionSource<T,TReturn>): Operation<ChainableSubscription<T,TReturn>> {
  return yield ChainableSubscription.of(source);
}
