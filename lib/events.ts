// deno-lint-ignore-file no-explicit-any ban-types
import { createChannel } from "./channel.ts";
import { action, resource, suspend } from "./instructions.ts";
import { useScope } from "./run/scope.ts";
import type { Operation, Stream } from "./types.ts";

type FN = (...any: any[]) => any;

type EventTypeFromEventTarget<T, K extends string> = `on${K}` extends keyof T
  ? Parameters<Extract<T[`on${K}`], FN>>[0]
  : Event;

export type EventList<T> = T extends {
  addEventListener(type: infer P, ...args: any): void;
  // we basically ignore this but we need it so we always get the first override of addEventListener
  addEventListener(type: infer P2, ...args: any): void;
} ? P & string
  : never;

/**
 * Takes an event source and event name and returns an
 * {@link effection:Operation} that produces the value emitted by that
 * event. Both {@link EventTarget} and {@link EventEmitter} are
 * supported.
 *
 * ### Example
 *
 * ``` javascript
 * let start = yield once(document, 'dragstart');
 * console.log(`drag started at (${start.pageX}, ${start.pageY})`);
 *
 * let end = yield once(document, 'dragend');
 * console.log(`drag ended at (${end.pageX}, ${end.pageY})`);
 * ```
 *
 * ### Example
 *
 * ``` javascript
 * let src = yield once(stream, 'pipe');
 * ```
 *
 * @param source an object which emits events
 * @param eventName the name of the event to subscribe to
 * @typeParam T the type of the argument to the emitted event
 */
export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Operation<EventTypeFromEventTarget<T, K>> {
  return action(function* (resolve) {
    target.addEventListener(
      name,
      resolve as EventListenerOrEventListenerObject,
    );
    try {
      yield* suspend();
    } finally {
      target.removeEventListener(
        name,
        resolve as EventListenerOrEventListenerObject,
      );
    }
  });
}

/**
 * Creates a `Stream` from an event source and event name that
 * produces the event as its next value every time that the source
 * raises it. Streams created in this way are infinite.
 *
 * Both
 * [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
 * from the browser DOM and
 * [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter)
 * from node are supported.
 *
 * ### Example
 *
 * log every click in a web page:
 *
 * ```javascript
 * yield spawn(on(document, 'click').forEach(event => {
 *   console.log(`click at (${event.pageX}, ${event.pageY})`);
 * }));
 * ```
 *
 * ### Example
 *
 * buffer a node process's stdin into a single string:
 *
 * ```javascript
 * let buffer = '';
 * yield spawn(on(process.stdin, 'data').forEach(data => {
 *   buffer += data;
 * }));
 * ```
 *
 * @param source an object which emits events
 * @param name the name of the event to subscribe to
 * @param streamName the name of the returned stream, useful for debugging
 * @typeParam T the type of the argument to the emitted event
 */
export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Stream<EventTypeFromEventTarget<T, K>, never> {
  return resource(function* (provide) {
    let { input, output } = createChannel<Event, never>();
    let scope = yield* useScope();
    let listener = (event: Event) => scope.run(() => input.send(event));

    target.addEventListener(name, listener);

    try {
      yield* provide(
        yield* output as Stream<EventTypeFromEventTarget<T, K>, never>,
      );
    } finally {
      target.removeEventListener(name, listener);
    }
  });
}
