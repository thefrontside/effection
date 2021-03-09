import { createStream, Stream } from '@effection/subscription';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

export type ChannelOptions = {
  maxSubscribers?: number;
}

export interface Channel<T, TClose = undefined> extends Stream<T, TClose> {
  send(message: T): void;
  close(...args: TClose extends undefined ? [] : [TClose]): void;
}

export function createChannel<T, TClose = undefined>(options: ChannelOptions = {}): Channel<T, TClose> {
  let bus = new EventEmitter();

  if(options.maxSubscribers) {
    bus.setMaxListeners(options.maxSubscribers);
  }

  let subscribable = createStream<T, TClose>((publish) => function*(task) {
    let subscription = on(bus, 'event').subscribe(task);
    while(true) {
      let { value: next } = yield subscription.next();
      if(next.done) {
        return next.value;
      } else {
        publish(next.value);
      }
    }
  });

  return Object.assign(subscribable, {
    send(message: T) {
      bus.emit('event', { done: false, value: message });
    },

    close(...args: TClose extends undefined ? [] : [TClose]) {
      bus.emit('event', { done: true, value: args[0] });
    }
  });
}
