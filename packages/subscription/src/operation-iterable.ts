import { Operation, Task } from 'effection';
import { OperationIterator } from './operation-iterator';
import { SymbolOperationIterable } from './symbol-operation-iterable';

export interface OperationIterable<T,TReturn> {
  [SymbolOperationIterable](task: Task<unknown>): OperationIterator<T,TReturn>;
}
