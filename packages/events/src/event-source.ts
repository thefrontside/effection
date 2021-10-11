import { EventEmitter } from 'events';

/**
 * An object which is able to emit events, and provides methods to subsribe and
 * unsubscribe to these events. Both
 * [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
 * from the browser DOM and
 * [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter)
 * from node are supported.
 */
export type EventSource = EventEmitterSource | EventTargetSource

function isEventTarget(target: EventSource): target is EventTargetSource {
  return typeof (target as EventTargetSource).addEventListener === 'function';
}

export function addListener<TArgs extends unknown[] = [unknown]>(source: EventSource, name: string, listener: (...args: TArgs) => void): void {
  if(isEventTarget(source)) {
    source.addEventListener(name, listener as () => void);
  } else {
    source.on(name, listener as () => void);
  }
}

export function removeListener<TArgs extends unknown[] = [unknown]>(source: EventSource, name: string, listener: (...args: TArgs) => void): void {
  if(isEventTarget(source)) {
    source.removeEventListener(name, listener as () => void);
  } else {
    source.off(name, listener as () => void);
  }
}

interface EventTargetSource {
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
}

interface EventEmitterSource {
  on: EventEmitter["on"];
  off: EventEmitter["off"];
}
