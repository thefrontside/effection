import { Operation } from '@effection/core';
import { OperationIterator } from './operation-iterator';

export interface Subscription<T, TReturn = undefined> extends OperationIterator<T, TReturn> {
  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
}
