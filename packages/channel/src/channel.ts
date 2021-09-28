import { createStream, WritableStream, Writable, Stream } from '@effection/stream';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

export type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

export type Send<T> = Writable<T>['send'];

export type ChannelOptions = {
  maxSubscribers?: number;
  name?: string;
}

export interface Channel<T, TClose = undefined> extends WritableStream<T, T, TClose> {
  close: Close<TClose>;
  stream: Stream<T, TClose>;
}

export function createChannel<T, TClose = undefined>(options: ChannelOptions = {}): Channel<T, TClose> {
  let bus = new EventEmitter();

  if(options.maxSubscribers) {
    bus.setMaxListeners(options.maxSubscribers);
  } else {
    bus.setMaxListeners(100000);
  }

  let stream = createStream<T, TClose>((publish) => function*(task) {
    let subscription = on(bus, 'event').subscribe(task);
    while(true) {
      let { value: next } = yield subscription.next();
      if(next.done) {
        return next.value;
      } else {
        publish(next.value);
      }
    }
  }, options.name);

  let send: Send<T> = (message: T) => {
    bus.emit('event', { done: false, value: message });
  };

  let close: Close<TClose> = (...args) => {
    bus.emit('event', { done: true, value: args[0] });
  };

  return { send, close, stream , ...stream };
}
