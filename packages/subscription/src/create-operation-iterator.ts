import { Operation, Task } from '@effection/core';
import { OperationIterator } from './operation-iterator';
import { Semaphore } from './semaphore';

export type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export function createOperationIterator<T, TReturn>(task: Task<unknown>, callback: Callback<T,TReturn>): OperationIterator<T,TReturn> {
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

  task.spawn(function*() {
    try {
      let value = yield callback((value: T) => publish(value));
      results.push({ done: true, value });
      semaphore.signal();
    } finally {
      publish = value => { throw InvalidPublication(value); }
    }
  });

  return { next };
}

function InvalidPublication(value: unknown) {
  let error = new Error(`tried to publish a value: ${value} on an already finished subscription`);
  error.name = 'TypeError';
  return error;
}
