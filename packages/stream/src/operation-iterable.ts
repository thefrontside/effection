import { Task } from '@effection/core';
import { OperationIterator } from '@effection/subscription';
import { SymbolOperationIterable } from './symbol-operation-iterable';

export interface ToOperationIterator<T, TReturn = undefined> {
  (task: Task): OperationIterator<T, TReturn>;
}

export interface OperationIterable<T, TReturn = undefined> {
  [SymbolOperationIterable]: ToOperationIterator<T, TReturn>;
}
