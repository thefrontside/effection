import { Operation } from 'effection';
import { Subscription } from './subscription';
import { SymbolSubscribable } from './symbol-subscribable';
import { subscribe } from './subscribe';
import { SubscriptionSource } from './subscription-source';
import { deprecated } from './deprecated';

export interface Subscribable<T,TReturn = undefined> {
  [SymbolSubscribable](): Operation<Subscription<T,TReturn>>;
}

export const Subscribable = {
  from: deprecated(
    '`Subscribable.from(source)` is deprecated, use `subscribe(source).map(...)` instead',
      <T,TReturn>(source: SubscriptionSource<T,TReturn>) => {
        return subscribe(source)
      }
  )
}
