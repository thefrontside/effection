import { Operation } from 'effection';
import { Subscription } from './subscription';
import { SymbolSubscribable } from './symbol-subscribable';
import { subscribe } from './subscribe';
import { SubscriptionSource } from './subscription-source';

export interface Subscribable<T,TReturn> {
  [SymbolSubscribable](): Operation<Subscription<T,TReturn>>;
}

export const Subscribable = {
  from<T,TReturn>(source: SubscriptionSource<T,TReturn>) {
    console.warn('`Subscribable.from(source)` is deprecated, use `subscribe(source).map(...)` instead');
    return subscribe(source)
  }
}
