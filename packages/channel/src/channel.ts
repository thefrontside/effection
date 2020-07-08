import { Operation } from 'effection';
import { Subscribable, Subscription, SymbolSubscribable, createSubscription } from '@effection/subscription';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

export class Channel<T, TClose = undefined> implements Subscribable<T, TClose> {
  private bus = new EventEmitter();

  [SymbolSubscribable](): Operation<Subscription<T, TClose>> {
    return this.subscribe();
  }

  setMaxListeners(value: number) {
    this.bus.setMaxListeners(value);
  }

  send(message: T) {
    this.bus.emit('event', { done: false, value: message });
  }

  subscribe(): Operation<Subscription<T, TClose>> {
    let { bus } = this;
    return createSubscription(function*(publish) {
      let subscription = yield on(bus, 'event');
      while(true) {
        let [event] = yield subscription.expect();
        if(event.done) {
          return event.value;
        } else {
          publish(event.value);
        }
      }
    });
  }

  close(...args: TClose extends undefined ? [] : [TClose]) {
    this.bus.emit('event', { done: true, value: args[0] });
  }
}
