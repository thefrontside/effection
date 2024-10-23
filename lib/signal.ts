import type { Stream, Subscription } from "./types.ts";

import { createQueue, type Queue } from "./queue.ts";
import { resource } from "./resource.ts";
import { createContext } from "./context.ts";

/**
 * Convert plain JavaScript function calls into a {@link Stream} that can
 * be consumed within an operation. If no operation is subscribed to a signal's
 * stream, then sending messages to it is a no-op.
 *
 * Signals are particularly suited to be installed as event listeners.
 *
 * @example
 * ```typescript
 * import { createSignal, each } from "effection";
 *
 * export function* logClicks(function*(button) {
 *   let clicks = createSignal<MouseEvent>();
 *
 *   button.addEventListener("click", clicks.send);
 *
 *   try {
 *     for (let click of yield* each(clicks)) {
 *       console.log(`click:`, click);
 *       yield* each.next();
 *     }
 *   } finally {
 *     button.removeEventListener("click", clicks.send);
 *   }
 * })
 * ````
 *
 * @typeParam T - type of each event sent by this signal
 * @typeParam TClose - type of the final event sent by this signal
 */
export interface Signal<T, TClose> extends Stream<T, TClose> {
  /**
   * Send a value to all the consumers of this signal.
   *
   * @param value - the value to send.
   */
  send(value: T): void;

  /**
   * Send the final value of this signal to all its consumers.
   * @param value - the final value.
   */
  close(value: TClose): void;
}

/**
 * @ignore
 * {@link Context} that contains a {@link Queue} factory to be used when creating a {@link Signal}.
 *
 * This allows end-users to customize a Signal's Queue.
 *
 * @example
 * ```javascript
 * export function useActions(pattern: ActionPattern): Stream<AnyAction, void> {
 *  return {
 *    *[Symbol.iterator]() {
 *      const actions = yield* ActionContext;
 *      yield* QueueFactory.set(() => createFilterQueue(matcher(pattern));
 *      return yield* actions;
 *    }
 *  }
 * }
 *
 * function createFilterQueue(predicate: Predicate) {
 *  let queue = createQueue();
 *
 *  return {
 *    ...queue,
 *    add(value) {
 *      if (predicate(value)) {
 *        queue.add(value);
 *      }
 *    }
 *  }
 * }
 * ```
 */
export const SignalQueueFactory = createContext(
  "Signal.createQueue",
  createQueue,
);

/**
 * Create a new {@link Signal}
 *
 * Signal should be used when you need to send messages to a stream
 * from _outside_ of an operation. The most common case of this is to
 * connect a plain, synchronous JavaScript callback to an operation.
 *
 * @example
 * ```javascript
 * function* logClicks(button) {
 *   let clicks = createSignal<MouseEvent>();
 *   try {
 *     button.addEventListener("click", clicks.send);
 *
 *     for (let click of yield* each(clicks)) {
 *       console.log("click", click);
 *     }
 *    } finally {
 *      button.removeEventListener("click", clicks.send);
 *    }
 * }
 * ```
 *
 * Do not use a signal to send messages from within an operation as it could
 * result in out-of-scope code being executed. In those cases, you should use a
 * {@link Channel}.
 */
export function createSignal<T, TClose = never>(): Signal<T, TClose> {
  let subscribers = new Set<Queue<T, TClose>>();

  let subscribe = resource<Subscription<T, TClose>>(function* (provide) {
    let newQueue = yield* SignalQueueFactory.expect();
    let queue = newQueue<T, TClose>();
    subscribers.add(queue);

    try {
      yield* provide({ next: queue.next });
    } finally {
      subscribers.delete(queue);
    }
  });

  function send(value: T) {
    for (let queue of [...subscribers]) {
      queue.add(value);
    }
  }

  function close(value: TClose) {
    for (let queue of [...subscribers]) {
      queue.close(value);
    }
  }

  return { ...subscribe, send, close };
}
