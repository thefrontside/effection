import type { Stream, Subscription } from "./types.ts";

import { createQueue, type Queue } from "./queue.ts";
import { resource } from "./resource.ts";
import { createContext } from "./context.ts";
import type { Context } from "./types.ts";

/**
 * Convert plain JavaScript function calls into a [Stream](/api/Stream) that can
 * be consumed within an operation. If no operation is subscribed to a signal's
 * stream, then sending messages to it is a no-op.
 *
 * Signals are particularly suited to be installed as event listeners.
 *
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


 */
export interface Signal<T, TClose> extends Stream<T, TClose> {
  /**
   * Send a value to all the consumers of this signal.
   */
  send(value: T): void;

  /**
   * Send the final value of this signal to all its consumers.
   */
  close(value: TClose): void;
}

/**

 * [Context](/api/Context) that contains a [Queue](/api/Queue) factory to be used when creating a [Signal](/api/Signal).
 *
 * This allows end-users to customize a Signal's Queue.
 *
 * ```ts
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
export const SignalQueueFactory: Context<typeof createQueue> = createContext(
  "Signal.createQueue",
  createQueue,
);

/**
 * Create a new [Signal](/api/Signal)
 *
 * Signal should be used when you need to send messages to a stream
 * from _outside_ of an operation. The most common case of this is to
 * connect a plain, synchronous JavaScript callback to an operation.
 *
 * ```ts
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
 * [Channel](/api/Channel).
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
