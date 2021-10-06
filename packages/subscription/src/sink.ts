import { Operation } from '@effection/core';

export type Close<T> = T extends undefined ? ((value?: T) => Operation<void>) : ((value: T) => Operation<void>);

export interface Sink<T, TReturn = undefined> {
  send(message: T): Operation<void>;
  close: Close<TReturn>;
}
