import { resource, Operation } from 'effection';
import { EventSource, addListener, removeListener } from './event-source';
import { once } from './once';

export class Subscription<T extends Array<unknown>> implements Iterable<Operation<T>> {
  private events: T[] = [];

  constructor(private source: EventSource, private eventName: string) {}

  *next(): Operation<T> {
    while(true) {
      let [event, ...events] = this.events;
      if (event) {
        this.events = events;
        return event;
      }
      yield once(this.source, this.eventName);
    }
  }

  *subscribe(): Operation<void> {
    let listener = (...args: T) => this.events.push(args)
    try {
      addListener(this.source, this.eventName, listener);
      yield;
    } finally {
      removeListener(this.source, this.eventName, listener);
    }

  }

  [Symbol.iterator]() {
    return {
      next: () => ({ done: false, value: this.next() })
    }
  }
}


export function* on<T extends Array<unknown> = unknown[]>(source: EventSource, name: string): Operation<Subscription<T>> {
  let subscription = new Subscription<T>(source, name);
  return yield resource(subscription, subscription.subscribe());
}
