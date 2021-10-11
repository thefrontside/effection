import { Operation, createFuture, withLabels } from '@effection/core';
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
 *
 * @param source an object which emits events
 * @param eventName the name of the event to subscribe to
 * @typeParam T the type of the argument to the emitted event
 */
export function once<T = unknown>(source: EventSource, eventName: string): Operation<T> {
  return withLabels((task) => {
    let { future, resolve } = createFuture<T>();
    let listener = (...args: T[]) => { resolve(args[0]) };
    addListener(source, eventName, listener);
    task.consume(() => removeListener(source, eventName, listener));
    return future;
  }, { name: `once`, eventName, source: source.toString() });
}

/**
 * Exactly like {@link once | once()} except the value produced is an
 * array of all the arguments passed when the event was
 * dispatched.
 *
 * In very rare cases, some event emitters pass multiple arguments to
 * their event handlers. For example the [ChildProcess](https://nodejs.org/api/child_process.html) in
 * NodeJS emits both a status code _and_ a signal to the 'exit'
 * event. It would not be possible to read the signal from the `exit`
 * event using just the `once()` operation, so you would need to use
 * the `onceEmit()` operation to get all the arguments sent to the
 * event handler as an array.
 *
 * While it is supported, you should never need to use `onceEmit()` on an
 * `EventTarget` since only a single argument is ever passed to its event
 * handler. In those cases, always use {@link once | once()}
 *
 * ### Example
 *
 * ```javascript
 * let [exitCode, signal] = yield onEmit(childProcess, 'exit');
 * ```
 *
 * @param source an object which emits events
 * @param eventName the name of the event to subscribe to
 * @typeParam TArgs the type of the array of arguments to the emitted event
 */
export function onceEmit<TArgs extends unknown[] = unknown[]>(source: EventSource, eventName: string): Operation<TArgs> {
  return withLabels((task) => {
    let { future, resolve } = createFuture<TArgs>();
    let listener = (...args: unknown[]) => { resolve(args as TArgs) };
    addListener(source, eventName, listener);
    task.consume(() => removeListener(source, eventName, listener));
    return future;
  }, { name: `onceEmit`, eventName, source: source.toString() });
}
