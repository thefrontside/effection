// deno-lint-ignore-file no-explicit-any ban-types
import { createSignal } from "./signal.ts";
import { resource } from "./resource.ts";
import type { Operation, Stream, Subscription } from "./types.ts";

type FN = (...any: any[]) => any;

type EventTypeFromEventTarget<T, K extends string> = `on${K}` extends keyof T
  ? Parameters<Extract<T[`on${K}`], FN>>[0]
  : Event;

/**

 */
export type EventList<T> = T extends {
  addEventListener(type: infer P, ...args: any): void;
  // we basically ignore this but we need it so we always get the first override of addEventListener
  addEventListener(type: infer P2, ...args: any): void;
} ? P & string
  : never;

/**
 * Create an [Operation](/api/Operation) that yields the next event to be emitted by an
 * [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).
 */
export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Operation<EventTypeFromEventTarget<T, K>> {
  return {
    *[Symbol.iterator]() {
      let subscription = yield* on(target, name);
      let next = yield* subscription.next();
      return next.value;
    },
  };
}

/**
 * Create a [Stream](/api/Stream) of events from any
 * [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).
 *
 * See the guide on [Streams and Subscriptions](https://frontside.com/effection/docs/collections)
 * for details on how to use streams.
 */
export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Stream<EventTypeFromEventTarget<T, K>, never> {
  return resource(function* (provide) {
    let signal = createSignal<Event>();

    target.addEventListener(name, signal.send);

    try {
      yield* provide(
        yield* signal as Operation<
          Subscription<EventTypeFromEventTarget<T, K>, never>
        >,
      );
    } finally {
      target.removeEventListener(name, signal.send);
    }
  });
}
