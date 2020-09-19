import { Operation, Task } from 'effection';
import { Subscription, SymbolOperationIterable, OperationIterator, OperationIterable } from '@effection/subscription';
import { on } from '@effection/events';
import { EventEmitter } from 'events';

export class Channel<T, TClose = undefined> implements OperationIterable<T, TClose> {
  private bus = new EventEmitter();

  [SymbolOperationIterable](task: Task): OperationIterator<T, TClose> {
    return this.subscribe(task);
  }

  setMaxListeners(value: number) {
    this.bus.setMaxListeners(value);
  }

  send(message: T) {
    this.bus.emit('event', { done: false, value: message });
  }

  subscribe(task: Task): Subscription<T, TClose> {
    let { bus } = this;
    return Subscription.create(task, function*(publish): Operation<TClose> {
      let subscription = on(task, bus, 'event');
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
