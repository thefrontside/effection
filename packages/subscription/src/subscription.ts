import { Operation } from 'effection';

export type Subscriber<T,TReturn> = (publish: (value: T) => void) => Operation<TReturn>;

export interface Subscription<T,TReturn> {
  next(): Operation<IteratorResult<T,TReturn>>;
}
