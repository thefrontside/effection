import { Operation, resource } from '@effection/core';
import { Subscription } from './subscription';
import { DeepPartial, matcher } from './match';
import { SubscriptionSource, rawSubscribe } from './subscription-source';

const DUMMY = { next() { throw new Error('dummy') } };

export class ChainableSubscription<T,TReturn = undefined> implements Subscription<T,TReturn> {
  constructor(private subscription: Subscription<T, TReturn>) {}

  static *of<T, TReturn>(source: SubscriptionSource<T, TReturn>): Operation<ChainableSubscription<T, TReturn>> {
    let chain = new ChainableSubscription(DUMMY);

    return yield resource(chain, function*() {
      chain.subscription = yield rawSubscribe(source);
      yield;
    });
  }

  static *wrap<T, TReturn, R = T>(
    source: Operation<ChainableSubscription<T, TReturn>>,
    fn: (inner: ChainableSubscription<T, TReturn>) => ChainableSubscription<R, TReturn>,
  ): Operation<ChainableSubscription<R, TReturn>> {
    let chain = new ChainableSubscription<R, TReturn>(DUMMY);

    return yield resource(chain, function*() {
      let subscription = yield source;
      chain.subscription = fn(subscription);
      yield;
    });
  }

  filter(predicate: (value: T) => boolean): ChainableSubscription<T, TReturn> {
    let { subscription } = this;
    return new ChainableSubscription({
      *next() {
        while(true) {
          let result = yield subscription.next();
          if(result.done) {
            return result;
          } else if(predicate(result.value)) {
            return result;
          }
        }
      }
    });
  }

  match(reference: DeepPartial<T>): ChainableSubscription<T,TReturn> {
    return this.filter(matcher(reference));
  }

  map<R>(mapper: (value: T) => R): ChainableSubscription<R, TReturn> {
    let { subscription } = this;
    return new ChainableSubscription({
      *next() {
        while(true) {
          let result = yield subscription.next();
          if(result.done) {
            return result;
          } else {
            return { done: false, value: mapper(result.value) };
          }
        }
      }
    });
  }

  *first(): Operation<T | undefined> {
    let result: IteratorResult<T,TReturn> = yield this.subscription.next();
    if(result.done) {
      return undefined;
    } else {
      return result.value;
    }
  }

  *expect(): Operation<T> {
    let result: IteratorResult<T,TReturn> = yield this.subscription.next();
    if(result.done) {
      throw new Error('expected subscription to contain a value');
    } else {
      return result.value;
    }
  }

  *forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
    while (true) {
      let result: IteratorResult<T,TReturn> = yield this.subscription.next();
      if(result.done) {
        return result.value;
      } else {
        yield visit(result.value);
      }
    }
  }

  next() {
    return this.subscription.next();
  }
}
