import { Operation } from '@effection/core';
import { once } from './once';
import { EventSource } from './event-source';

/**
 * Subscribe to the `error` event and throw the emitted error.
 *
 * In evented code, errors are often emitted as an event named `error`.
 * Within Effection, we want to take this emitted error and throw it, so that
 * upstream code can handle the failure in some sensible way. While this is
 * simple to implement, it is such a common pattern that we have provided this
 * helper function to simplify this type of code.
 *
 * ### Example
 *
 * A WebSocket can emit an error event when the connection fails:
 *
 * ```javascript
 * let socket = new WebSocket(url);
 * yield throwOnErrorEvent(socket);
 * yield on(socket, 'message').forEach((message) => { ... });
 * ```
 *
 * @param source an object which emits error events
 */
export function *throwOnErrorEvent(source: EventSource): Operation<void> {
  let error: Error = yield once(source, 'error');
  throw error;
}
