import { withLabels } from '@effection/core';
import { createStream, Stream } from '@effection/stream';
import { EventSource, addListener, removeListener } from './event-source';


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
export function on<T = unknown>(source: EventSource, name: string, streamName = `on('${name}')`): Stream<T, void> {
  return createStream((publish) => withLabels(function*() {
    addListener(source, name, publish);
    try {
      yield;
    } finally {
      removeListener(source, name, publish);
    }
  }, { name: 'listen', eventName: name, source: source.toString() }), streamName);
}

/**
 * Exactly like {@link on | on()} except each value produced by the
 * stream is an array of all the arguments passed when the event was
 * dispatched.
 *
 * This should rarely be needed, and never with `EventTarget`
 * which always invoke their event listeners with a single argument.
 *
 * ### Example
 *
 * stream an odd-ball event emitter that passes multiple arguments to
 * its handers. Most event emitters do not act this way:
 *
 * ```javascript
 * let emitter = new EventEmitter();
 *
 * yield spawn(onEmit(emitter, 'multiplication').forEach(([left, right]) => {
 *   console.log(`${left} times ${right} = ${left * right}!`);
 * }));
 *
 * yield sleep(10);
 *
 * emitter.emit('multiplication', 7, 6);
 * //=> 7 times 6 = 42!
 * ```
 *
 * @param source an object which emits events
 * @param name the name of the event to subscribe to
 * @param streamName the name of the returned stream, useful for debugging
 * @typeParam TArgs the type of the array of arguments to the emitted event
 */
export function onEmit<TArgs extends Array<unknown> = unknown[]>(source: EventSource, name: string, streamName = `onEmit('${name}')`): Stream<TArgs, void> {
  return createStream((publish) => withLabels(function*() {
    let listener = (...args: TArgs) => publish(args);
    addListener(source, name, listener);
    try {
      yield;
    } finally {
      removeListener(source, name, listener);
    }
  }, { name: 'listen', eventName: name, source: source.toString() }), streamName);
}
