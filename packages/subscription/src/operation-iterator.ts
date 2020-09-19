import { Operation } from 'effection';

export interface OperationIterator<T, TReturn = undefined> {
  next(): Operation<IteratorResult<T, TReturn>>;
}
