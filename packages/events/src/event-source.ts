import { EventEmitter } from 'events';

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
