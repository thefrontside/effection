import { Operation } from 'effection';
import { ChainableSubscription } from './chainable-subscription';
import { DeepPartial } from './match';
import { Subscribable } from './subscribable';
import { SymbolSubscribable } from './symbol-subscribable';
import { Subscription } from './subscription';

export interface ChainableSubscribableMethods<T,TReturn = undefined> extends Subscribable<T,TReturn> {
  filter(predicate: (value: T) => boolean): ChainableSubscribable<T, TReturn>;
  match(reference: DeepPartial<T>): ChainableSubscribable<T,TReturn>;
  map<R>(mapper: (value: T) => R): ChainableSubscribable<R, TReturn>;
  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => Operation<void>): Operation<TReturn>;
  next(): Operation<IteratorResult<T, TReturn>>;
}

export type ChainableSubscribable<T, TReturn = undefined> = Operation<ChainableSubscription<T, TReturn>> & ChainableSubscribableMethods<T, TReturn>;

export function makeChainable<T, TReturn = undefined>(
  operation: Operation<ChainableSubscription<T, TReturn>>
): ChainableSubscribable<T, TReturn> {
  return Object.assign(operation, {
    *[SymbolSubscribable](): Operation<Subscription<T,TReturn>> {
      return yield operation;
    },

    filter(predicate: (value: T) => boolean): ChainableSubscribable<T, TReturn> {
      return makeChainable(function*() {
        return yield ChainableSubscription.wrap<T, TReturn>(operation, (inner) => inner.filter(predicate));
      });
    },

    match(reference: DeepPartial<T>): ChainableSubscribable<T,TReturn> {
      return makeChainable(function*() {
        return yield ChainableSubscription.wrap<T, TReturn>(operation, (inner) => inner.match(reference));
      });
    },

    map<R>(mapper: (value: T) => R): ChainableSubscribable<R, TReturn> {
      return makeChainable(function*() {
        return yield ChainableSubscription.wrap<T, TReturn, R>(operation, (inner) => inner.map(mapper));
      });
    },

    *first(): Operation<T | undefined> {
      return yield (yield operation).first();
    },

    *expect(): Operation<T> {
      return yield (yield operation).expect();
    },

    *forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
      return yield (yield operation).forEach(visit);
    },

    *next(): Operation<IteratorResult<T, TReturn>> {
      return yield (yield operation).next();
    }
  });
};
