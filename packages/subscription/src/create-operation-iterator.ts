import { Operation, Task } from '@effection/core';
import { OperationIterator } from './operation-iterator';
import { createQueue } from './queue';

export type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export function createOperationIterator<T, TReturn>(task: Task<unknown>, callback: Callback<T,TReturn>): OperationIterator<T,TReturn> {
  let queue = createQueue<IteratorResult<T, TReturn>>();

  let publish = (value: T) => {
    queue.push({ done: false, value });
  };

  task.spawn(function*() {
    try {
      let value = yield callback((value: T) => publish(value));
      queue.push({ done: true, value });
    } finally {
      publish = value => { throw InvalidPublication(value); }
    }
  });

  return {
    next: () => function*() {
      return yield queue.pop();
    }
  };
}

function InvalidPublication(value: unknown) {
  let error = new Error(`tried to publish a value: ${value} on an already finished subscription`);
  error.name = 'TypeError';
  return error;
}
