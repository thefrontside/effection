import { spawn } from "./instructions.ts";
import type { Channel } from "./types.ts";

const BUFFER_OVERFLOW = "buffer overflow!";

const ON_OVERFLOW_THROW = 1;
const ON_OVERFLOW_DROP = 2;
const ON_OVERFLOW_SLIDE = 3;
const ON_OVERFLOW_EXPAND = 4;

const noop = () => {};
const zeroBuffer = { isEmpty: () => true, flush: noop, put: noop, take: noop };

interface RingBuffer<T> {
  isEmpty: () => boolean;
  flush: () => void;
  put: (it: T) => void;
  take: () => T;
}

function ringBuffer<T>(limit = 10, overflowAction: number): RingBuffer<T> {
  let queue = new Array(limit);
  let length = 0;
  let pushIndex = 0;
  let popIndex = 0;

  const push = (it: T) => {
    queue[pushIndex] = it;
    pushIndex = (pushIndex + 1) % limit;
    length++;
  };

  const take = () => {
    if (length != 0) {
      let it = queue[popIndex];
      queue[popIndex] = null;
      length--;
      popIndex = (popIndex + 1) % limit;
      return it;
    }
  };

  const flush = () => {
    let items = [];
    while (length) {
      items.push(take());
    }
    return items;
  };

  return {
    isEmpty: () => length == 0,
    take,
    flush,
    put: (it: T) => {
      if (length < limit) {
        push(it);
        return;
      }

      let doubledLimit;
      switch (overflowAction) {
        case ON_OVERFLOW_THROW:
          throw new Error(BUFFER_OVERFLOW);
        case ON_OVERFLOW_SLIDE:
          queue[pushIndex] = it;
          pushIndex = (pushIndex + 1) % limit;
          popIndex = pushIndex;
          break;
        case ON_OVERFLOW_EXPAND:
          doubledLimit = 2 * limit;

          queue = flush();

          length = queue.length;
          pushIndex = queue.length;
          popIndex = 0;

          queue.length = doubledLimit;
          limit = doubledLimit;

          push(it);
          break;
        default:
          // DROP
      }
    },
  };
}

export function pipe<T>(buffer: RingBuffer<T>) {
  function* piper(chan: Channel<T, void>) {
    yield* spawn(function*() {
      const msgList = yield* chan.output;
      while (true) {
        const next = yield* msgList;
        if (next.done) {
          return;
        }

          buffer.put(next.value);
      }
    });

    return {
      *[Symbol.iterator]() {
        if (buffer.isEmpty()) {
          console.log("buffer empty");
          return;
        }
        return buffer.take();
      },
    };
  }

  return piper;
}

export const none = () => zeroBuffer;
export const fixed = <T>(limit = 10) => ringBuffer<T>(limit, ON_OVERFLOW_THROW);
export const dropping = <T>(limit = 10) => ringBuffer<T>(limit, ON_OVERFLOW_DROP);
export const sliding = <T>(limit = 10) => ringBuffer<T>(limit, ON_OVERFLOW_SLIDE);
export const expanding = <T>(initialSize = 10) =>
  ringBuffer<T>(initialSize, ON_OVERFLOW_EXPAND);
