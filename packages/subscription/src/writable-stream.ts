import { Stream } from './stream';

export interface Writable<T> {
  send(message: T): void;
}

export type WritableStream<TReceive, TSend, TReturn = undefined> = Stream<TReceive, TReturn> & Writable<TSend>;
