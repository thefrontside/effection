import { Operation, resource } from 'effection';

import { Semaphore } from './semaphore';

export type Subscriber<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Subscription<T,TReturn> {
  next(): Operation<IteratorResult<T,TReturn>>;
}

export function * createSubscription<T, TReturn>(subscribe: Subscriber<T,TReturn>): Operation<Subscription<T,TReturn>> {
  let values: T[] = [];
  let result: TReturn;

  let semaphore = new Semaphore<boolean>();

  let publish = (value: T) => {
    values.push(value);
    semaphore.signal(false);
  };

  let next = async () => {
    let wait = semaphore.wait();
    if (values.length > 0) {
      semaphore.signal(false);
    }
    return wait.then(done => ({ done, value: done ? result : values.shift()}));
  };

  let subscription =  yield resource({ next }, function*() {
    try {
      result = yield subscribe((value: T) => publish(value));
      semaphore.signal(true);
    } finally {
      publish = value => { throw InvalidPublication(value); }
    }
  });

  return subscription;
}

function InvalidPublication(value: unknown) {
  let error = new Error(`tried to publish a value: ${value} on an already finished subscription`);
  error.name = 'TypeError';
  return error;
}
