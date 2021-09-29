export interface Buffer<T> extends Iterable<T> {
  push(value: T): void;
}

export function createBuffer<T>(size = Infinity): Buffer<T> {
  if(size === Infinity) {
    return new Array<T>();
  } else {
    return createRingBuffer<T>(size);
  }
}

export function createRingBuffer<T>(size: number): Buffer<T> {
  let head = 0;
  let buffer: T[] = [];

  return {
    push(value: T): void {
      buffer[head] = value;
      head += 1;
      if(head >= size) {
        head = 0;
      }
    },

    *[Symbol.iterator]() {
      for(let current = 0; current < buffer.length; current++) {
        yield buffer[(current + head) % buffer.length];
      }
    }
  };
}
