export { Subscription } from './subscription';
export { createSubscription } from './create-subscription';
export { SymbolSubscribable } from './symbol-subscribable';
export { Subscribable } from './subscribable';
export { SubscriptionSource } from './subscription-source';
export { ChainableSubscription } from './chainable-subscription';
export { ChainableSubscribable } from './chainable-subscribable';
export { subscribe } from './subscribe';

import { Operation, deprecated } from '@effection/core';
import { SubscriptionSource } from './subscription-source';
import { subscribe } from './subscribe';

export const forEach = deprecated(
  '`forEach(source, ...)` is deprecated, use `subscribe(source).forEach(...)` instead',
  function* forEach<T,TReturn>(source: SubscriptionSource<T,TReturn>, visit: (value: T) => Operation<void>): Operation<TReturn> {
    return yield subscribe<T, TReturn>(source).forEach(visit);
  }
);
