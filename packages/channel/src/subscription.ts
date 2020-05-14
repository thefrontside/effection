import { Operation } from 'effection';

export interface Subscription<T> {
  next(): Operation<T>;
}
