import type { Computation } from "../deps.ts";
import type { Resolve } from "../types.ts";

import { shift } from "../deps.ts";

export interface EventStream<T, TClose> extends Computation<TClose> {
  observe(): EventObserver<T, TClose>;
  push(value: T): void;
  close(value: TClose): void;
}

export interface EventObserver<T, TClose>
  extends Computation<IteratorResult<T, TClose>> {
  drop(): void;
}

export function* forEach<T, TClose>(
  stream: EventStream<T, TClose>,
  each?: (event: T) => Computation<void>,
): Computation<TClose> {
  let events = stream.observe();
  try {
    while (true) {
      let next = yield* events;
      if (next.done) {
        return next.value;
      } else if (each) {
        yield* each(next.value);
      }
    }
  } finally {
    events.drop();
  }
}

export function createEventStream<T, TClose = void>(): EventStream<T, TClose> {
  type StreamState = {
    type: "open";
  } | {
    type: "closed";
    value: TClose;
  } | {
    type: "closing";
    value: TClose;
  };
  let state: StreamState = { type: "open" };

  let observers = new Map<
    EventObserver<T, TClose>,
    Resolve<IteratorResult<T, TClose>>
  >();

  let notify = (event: IteratorResult<T, TClose>) => {
    let handlers = [...observers.values()];
    for (let handler of handlers) {
      handler(event);
    }
  };

  let stream: EventStream<T, TClose> = {
    push(value: T) {
      notify({ done: false, value });
    },
    close(value: TClose) {
      if (state.type === "open") {
        notify({ done: true, value });
        state = { type: "closed", value };
      }
    },
    observe() {
      let events: IteratorResult<T, TClose>[] = [];
      let consumers: Resolve<IteratorResult<T, TClose>>[] = [];

      let observer: EventObserver<T, TClose> = {
        drop() {
          observers.delete(observer);
        },
        *[Symbol.iterator]() {
          let event = events.shift();
          if (event) {
            return event;
          } else if (state.type === "closed") {
            return { done: true, value: state.value };
          } else {
            return yield* shift<IteratorResult<T, TClose>>(function* (k) {
              consumers.push(k);
            });
          }
        },
      };
      observers.set(observer, (event) => {
        events.push(event);
        while (events.length > 0 && consumers.length > 0) {
          let consume = consumers.shift() as Resolve<T>;
          let event = events.shift() as T;
          consume(event);
        }
      });
      return observer;
    },
    *[Symbol.iterator]() {
      if (state.type === "closed") {
        return state.value;
      } else {
        return yield* forEach(stream);
      }
    },
  };
  return stream;
}
