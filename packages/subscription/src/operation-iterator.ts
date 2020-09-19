import { Operation } from '@effection/core';

export interface OperationIterator<T,TReturn> {
  next(): Operation<IteratorResult<T,TReturn>>;
}
