import { Operation } from '@effection/core';
import { EventSource, addListener, removeListener } from './event-source';


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
 */
export function once<T = unknown>(source: EventSource, eventName: string): Operation<T> {
  return {
    name: `once`,
    labels: { eventName, source: source.toString() },
    perform(resolve) {
      let listener = (...args: T[]) => { resolve(args[0]) };
      addListener(source, eventName, listener);
      return () => removeListener(source, eventName, listener);
    }
  };
}

/**
 * Exactly like {@link once | once()} except the value produced is an
 * {@link Array} of all the arguments passed when the event was
 * dispatched.
 *
 * In very rare cases, some event emitters pass multiple arguments to
 * their event handlers. For example the {@link ChildProcess} in
 * NodeJS emits both a status code _and_ a signal to the 'exit'
 * event. It would not be possible to read the signal from the `exit`
 * event using just the `once()` operation, so you would need to use
 * the `onceEmit()` operation to get all the arguments sent to the
 * event handler as an array.
 *
 * While it is supported, you should never need to use `onceEmit()` on
 * an {@link EventTarget} since only a single argument is ever passed
 * to its event handler. In those cases, always use {@link once | once()}
 *
 * ### Example
 *
 * ```javascript
 * let [exitCode, signal] = yield onEmit(childProcess, 'exit');
 * ```
 */
export function onceEmit<TArgs extends unknown[] = unknown[]>(source: EventSource, eventName: string): Operation<TArgs> {
  return {
    name: `onceEmit`,
    labels: { eventName, source: source.toString() },
    perform(resolve) {
      let listener = (...args: unknown[]) => { resolve(args as TArgs) };
      addListener(source, eventName, listener);
      return () => removeListener(source, eventName, listener);
    }
  };
}
