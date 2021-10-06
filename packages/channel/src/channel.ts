import { Sink, Close } from '@effection/subscription';
import { createStream, Stream } from '@effection/stream';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

export type ChannelOptions = {
  maxSubscribers?: number;
  name?: string;
}

export interface Channel<T, TClose = undefined> extends Stream<T, TClose>, Sink<T, TClose> {
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
        yield publish(next.value);
      }
    }
  }, options.name);

  let send = function*(message: T) {
    bus.emit('event', { done: false, value: message });
  };

  let close = function*(value: TClose) {
    bus.emit('event', { done: true, value });
  } as Close<TClose>;

  return { send, close, stream , ...stream };
}
