import { createStream, Stream } from '@effection/subscription';
import { EventSource, addListener, removeListener } from './event-source';


/**
 * Creates a {@link Stream} from an event source and event name that
 * produces the event as its next value every time that the source
 * raises it. Streams created in this way are infinite.
 *
 * Both {@link EventTarget} and {@link EventEmitter}
 * are supported.
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
 */
export function on<T = unknown>(source: EventSource, name: string, streamName = `on('${name}')`): Stream<T, void> {
  return createStream((publish) => ({
    name: 'listen',
    labels: { eventName: name, source: source.toString() },
    perform() {
      let listener = (...args: T[]) => publish(args[0]);
      addListener(source, name, listener);
      return () => removeListener(source, name, listener);
    }
  }), streamName);
}

/**
 * Exactly like {@link on | on()} except each value produced by the
 * stream is an {@link Array} of all the arguments passed when the event was
 * dispatched.
 *
 * This should rarely be needed, and never with {@link EventTarget}s
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
 */
export function onEmit<T extends Array<unknown> = unknown[]>(source: EventSource, name: string, streamName = `onEmit('${name}')`): Stream<T, void> {
    return createStream((publish) => ({
    name: 'listen',
    labels: { eventName: name, source: source.toString() },
    perform() {
      let listener = (...args: T) => publish(args);
      addListener(source, name, listener);
      return () => removeListener(source, name, listener);
    }
  }), streamName);
}
