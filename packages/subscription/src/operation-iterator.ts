import { Operation } from 'effection';

export interface OperationIterator<T,TReturn> {
  next(): Operation<IteratorResult<T,TReturn>>;
}
