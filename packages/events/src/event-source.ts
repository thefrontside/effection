import { EventEmitter } from 'events';

export type EventSource = EventEmitterSource | EventTargetSource

function isEventTarget(target: EventSource): target is EventTargetSource {
  return typeof (target as EventTargetSource).addEventListener === 'function';
}

export function addListener(source: EventSource, name: string, listener: () => void): void {
  if(isEventTarget(source)) {
    source.addEventListener(name, listener);
  } else {
    source.on(name, listener);
  }
}

export function removeListener(source: EventSource, name: string, listener: () => void): void {
  if(isEventTarget(source)) {
    source.removeEventListener(name, listener);
  } else {
    source.off(name, listener);
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
