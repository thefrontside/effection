import { Operation } from 'effection';
import { Subscribable, Subscription, SymbolSubscribable } from '@effection/subscription';
import { on } from '@effection/events';
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
    return Subscribable.from(on(this.bus, 'message')).map(([message]) => message as T)[SymbolSubscribable]();
  }
}
