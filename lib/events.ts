// deno-lint-ignore-file no-explicit-any ban-types
import { createSignal } from "./signal.ts";
import { resource } from "./instructions.ts";
import { first } from "./mod.ts";
import type { Operation, Stream, Subscription } from "./types.ts";

type FN = (...any: any[]) => any;

type EventTypeFromEventTarget<T, K extends string> = `on${K}` extends keyof T
  ? Parameters<Extract<T[`on${K}`], FN>>[0]
  : Event;

/**
 * @ignore
 */
export type EventList<T> = T extends {
  addEventListener(type: infer P, ...args: any): void;
  // we basically ignore this but we need it so we always get the first override of addEventListener
  addEventListener(type: infer P2, ...args: any): void;
} ? P & string
  : never;

/**
 * Create an {@link Operation} that yields the next event to be emitted by an
 * [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).
 *
 * @param target - the event target to be watched
 * @param name - the name of the event to watch. E.g. "click"
 * @returns an Operation that yields the next emitted event
 */
export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Operation<EventTypeFromEventTarget<T, K>> {
  return first(on(target, name));
}

/**
 * Create a {@link Stream} of events from any
 * [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).
 *
 * See the guide on [Streams and Subscriptions](https://frontside.com/effection/docs/collections)
 * for details on how to use streams.
 *
 * @param target - the event target whose events will be streamed
 * @param name - the name of the event to stream. E.g. "click"
 * @returns a stream that will see one item for each event
 */
export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Stream<EventTypeFromEventTarget<T, K>, never> {
  return {
    subscribe() {
      return resource(function* (provide) {
        let { send, subscribe } = createSignal<Event>();

        target.addEventListener(name, send);

        try {
          yield* provide(
            yield* subscribe() as Operation<
              Subscription<EventTypeFromEventTarget<T, K>, never>
            >,
          );
        } finally {
          target.removeEventListener(name, send);
        }
      });
    },
  };
}
