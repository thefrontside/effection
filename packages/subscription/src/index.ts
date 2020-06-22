export { Subscription, createSubscription } from './subscription';
export { SymbolSubscribable, SubscriptionSource, forEach, Subscribable } from './subscribable';
export { ChainableSubscription } from './chainable-subscription';

import { Operation } from 'effection';
import { subscribe as rawSubscribe } from './subscribable';
import { ChainableSubscription } from './chainable-subscription';
import { SubscriptionSource } from './subscribable';

export function* subscribe<T, TReturn>(source: SubscriptionSource<T,TReturn>): Operation<ChainableSubscription<T,TReturn>> {
  let inner = yield rawSubscribe(source);
  return new ChainableSubscription<T, TReturn>(inner);
}
