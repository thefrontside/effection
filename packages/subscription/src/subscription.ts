import { Operation, resource } from 'effection';

import { ChainableSubscription } from './chainable-subscription';
import { Semaphore } from './semaphore';

export type Subscriber<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Subscription<T,TReturn> {
  next(): Operation<IteratorResult<T,TReturn>>;
}

export function createSubscription<T, TReturn>(subscribe: Subscriber<T,TReturn>): Operation<Subscription<T,TReturn>> {
  return function*() {
    let results: IteratorResult<T,TReturn>[] = [];

    let semaphore = new Semaphore<void>();

    let publish = (value: T) => {
      results.push({ done: false, value });
      semaphore.signal();
    };

    let next = async (): Promise<IteratorResult<T,TReturn>> => {
      let wait = semaphore.wait();
      if (results.length > 0) {
        semaphore.signal();
      }
      return wait.then(() => results.shift() as IteratorResult<T,TReturn>);
    };

    let subscription = yield resource(new ChainableSubscription({ next }), function*() {
      try {
        let value = yield subscribe((value: T) => publish(value));
        results.push({ done: true, value });
        semaphore.signal();
      } finally {
        publish = value => { throw InvalidPublication(value); }
      }
    });

    return subscription;
  }
}

function InvalidPublication(value: unknown) {
  let error = new Error(`tried to publish a value: ${value} on an already finished subscription`);
  error.name = 'TypeError';
  return error;
}
