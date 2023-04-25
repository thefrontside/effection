import type { Channel, Resolve, Stream, Subscription } from "./types.ts";
import { action, resource } from "./instructions.ts";

export function createChannel<T, TClose = void>(): Channel<T, TClose> {
  let subscribers = new Set<ChannelSubscriber<T, TClose>>();

  let output: Stream<T, TClose> = resource(function* Subscription(provide) {
    let subscriber = createSubscriber<T, TClose>();
    subscribers.add(subscriber);

    try {
      yield* provide(subscriber.subscription);
    } finally {
      subscribers.delete(subscriber);
    }
  });

  let send = (item: IteratorResult<T, TClose>) => ({
    *[Symbol.iterator]() {
      for (let subscriber of [...subscribers]) {
        subscriber.deliver(item);
      }
    },
  });

  let input = {
    send: (value: T) => send({ done: false, value }),
    close: (value: TClose) => send({ done: true, value }),
  };

  return { input, output };
}

interface ChannelSubscriber<T, TClose> {
  deliver(item: IteratorResult<T, TClose>): void;
  subscription: Subscription<T, TClose>;
}

function createSubscriber<T, TClose>(): ChannelSubscriber<T, TClose> {
  type Item = IteratorResult<T, TClose>;

  let items: Item[] = [];
  let consumers: Resolve<Item>[] = [];

  return {
    deliver(item) {
      items.unshift(item);
      while (items.length > 0 && consumers.length > 0) {
        let consume = consumers.pop() as Resolve<Item>;
        let message = items.pop() as Item;
        consume(message);
      }
    },
    subscription: {
      *next() {
        let message = items.pop();
        if (message) {
          return message;
        } else {
          return yield* action<Item>(function* (resolve) {
            consumers.unshift(resolve);
          });
        }
      },
    },
  };
}
