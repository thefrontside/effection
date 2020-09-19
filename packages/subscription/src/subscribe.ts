import { Operation, Task } from 'effection';
import { Subscription } from './subscription';
import { OperationIterable } from './operation-iterable';

export function subscribe<T, TReturn>(task: Task<unknown>, iterable: OperationIterable<T, TReturn>): Subscription<T, TReturn> {
  return Subscription.of(task, iterable);
}
