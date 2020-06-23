import { Operation, spawn } from 'effection';
import { Subscribable, Subscription, SymbolSubscribable, createSubscription, forEach } from '@effection/subscription';
import { on, once } from '@effection/events';
import { EventEmitter } from 'events';

export class Channel<T> implements Subscribable<T, void> {
  private bus = new EventEmitter();

  [SymbolSubscribable](): Operation<Subscription<T, void>> {
    return this.subscribe();
  }

  setMaxListeners(value: number) {
    this.bus.setMaxListeners(value);
  }

  send(message: T) {
    this.bus.emit('message', message);
  }

  subscribe(): Operation<Subscription<T, void>> {
    let { bus } = this;
    return createSubscription(function*(publish) {
      yield spawn(forEach(on(bus, 'message'), function*([message]) {
        publish(message as T);
      }));
      yield once(bus, 'close');
    });
  }

  close() {
    this.bus.emit('close');
  }
}
