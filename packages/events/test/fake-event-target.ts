// a fake implementation of EventTarget in Node which does just enough
// so we can use it for testing

import { EventEmitter } from 'events';

export class FakeEvent implements Event {
  readonly bubbles: boolean = false;
  readonly cancelable: boolean = false;
  readonly composed: boolean = false;
  readonly currentTarget: EventTarget | null = null
  readonly defaultPrevented: boolean = false;
  readonly isTrusted: boolean = false;
  readonly srcElement: EventTarget | null = null;
  readonly target: EventTarget | null = null;
  readonly timeStamp: number = 1234;
  type: string;

  cancelBubble = false
  returnValue = false;

  constructor(type: string) {
    this.type = type;
  }

  composedPath(): EventTarget[] { return [] }
  initEvent(): void { return; }
  preventDefault(): void { return; }
  stopImmediatePropagation(): void { return; }
  stopPropagation(): void { return; }

  readonly AT_TARGET: number = 0;
  readonly BUBBLING_PHASE: number = 1;
  readonly CAPTURING_PHASE: number = 2;
  readonly NONE: number = 3;
  readonly eventPhase: number = this.NONE;
}

export class FakeEventEmitter implements EventTarget {
  private emitter = new EventEmitter();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    this.emitter.on(type, listener as () => void);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    this.emitter.off(type, listener as () => void);
  }

  dispatchEvent(event: Event): boolean {
    this.emitter.emit(event.type, event);
    return true;
  }
}
