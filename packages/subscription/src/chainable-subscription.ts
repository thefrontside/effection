import { Operation } from 'effection';
import { Subscription } from './subscription';
import { DeepPartial, matcher } from './match';

export class ChainableSubscription<T,TReturn> implements Subscription<T,TReturn> {
  constructor(private subscription: Subscription<T, TReturn>) {}

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
