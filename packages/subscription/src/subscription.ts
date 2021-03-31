import { Operation, Task } from '@effection/core';
import { OperationIterator } from './operation-iterator';
import { createQueue } from './index';

type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Subscription<T, TReturn = undefined> extends OperationIterator<T, TReturn> {
  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
}

export function createSubscription<T, TReturn = undefined>(task: Task<unknown>, callback: Callback<T, TReturn>): Subscription<T, TReturn> {
  let queue = createQueue<T, TReturn>();
  task.spawn(function*() {
    let result = yield callback(queue.send);
    queue.closeWith(result);
  });
  return queue.subscription;
}
