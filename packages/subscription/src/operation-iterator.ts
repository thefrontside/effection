import { Operation } from '@effection/core';

export interface OperationIterator<T, TReturn = undefined> {
  next(): Operation<IteratorResult<T, TReturn>>;
}
