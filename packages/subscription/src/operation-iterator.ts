import { Operation } from '@effection/core';

/**
 * @hidden
 */
export interface OperationIterator<T, TReturn = undefined> {
  next(): Operation<IteratorResult<T, TReturn>>;
}
