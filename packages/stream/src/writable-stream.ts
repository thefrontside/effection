import { Stream } from './stream';

/**
 * @hidden
 */
export interface Writable<T> {
  send(message: T): void;
}

/**
 * @hidden
 */
export type WritableStream<TReceive, TSend, TReturn = undefined> = Stream<TReceive, TReturn> & Writable<TSend>;
