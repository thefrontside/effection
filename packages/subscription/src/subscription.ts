import { Operation } from '@effection/core';
import { OperationIterator } from './operation-iterator';

type Callback<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Subscription<T, TReturn = undefined> extends OperationIterator<T, TReturn> {
  first(): Operation<T | undefined>;
  expect(): Operation<T>;
  forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn>;
  join(): Operation<TReturn>;
  collect(): Operation<Iterator<T, TReturn>>;
  toArray(): Operation<T[]>;
}
