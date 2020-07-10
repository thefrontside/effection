import { Operation } from 'effection';
import { Subscribable } from './subscribable';
import { Subscription } from './subscription';
import { SymbolSubscribable } from './symbol-subscribable';
import { ChainableSubscription } from './chainable-subscription';

// We have to add Subscription and ChainableSubscription separately here, even
// though ChainableSubscription is a subtype of Subscription because the
// `Operation<T>` type is invariant.
export type SubscriptionSource<T,TReturn> = Subscribable<T,TReturn> | Operation<Subscription<T,TReturn>> | Operation<ChainableSubscription<T,TReturn>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSubscribable<T,TReturn>(value: any): value is Subscribable<T,TReturn> {
  return !!value[SymbolSubscribable];
}

export function rawSubscribe<T, TReturn>(source: SubscriptionSource<T,TReturn>): Operation<Subscription<T,TReturn>> {
  if (isSubscribable<T,TReturn>(source)) {
    return source[SymbolSubscribable]()
  } else {
    return source as Operation<Subscription<T, TReturn>>;
  }
}
