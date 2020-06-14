import { EventEmitter } from 'events';

export type EventSource = EventEmitter | DOMEventTarget

function isEventTarget(target: EventSource): target is DOMEventTarget {
  return typeof (target as DOMEventTarget).addEventListener === 'function';
}

export function addListener(source: EventSource, name: string, listener: () => void) {
  if(isEventTarget(source)) {
    source.addEventListener(name, listener);
  } else {
    source.on(name, listener);
  }
}

export function removeListener(source: EventSource, name: string, listener: () => void) {
  if(isEventTarget(source)) {
    source.removeEventListener(name, listener);
  } else {
    source.off(name, listener);
  }
}

interface DOMEventTarget {
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
}
