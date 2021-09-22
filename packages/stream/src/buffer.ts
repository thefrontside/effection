export interface BufferLike<T> extends Iterable<T> {
  push(value: T): void;
}

export class RingBuffer<T> implements BufferLike<T> {
  private head = 0;
  private buffer: T[] = [];

  constructor(private size: number) {
  }

  push(value: T): void {
    this.buffer[this.head] = value;
    this.head += 1;
    if(this.head >= this.size) {
      this.head = 0;
    }
  }

  toArray(): T[] {
    return this.buffer.slice(this.head).concat(this.buffer.slice(0, this.head));
  }

  [Symbol.iterator](): Iterator<T> {
    let head = this.head;
    let current = 0;

    return {
      next: (): IteratorResult<T> => {
        if(current >= this.buffer.length) {
          return { done: true, value: undefined };
        }

        let value = this.buffer[(current + head) % this.buffer.length];

        current += 1;
        return { done: false, value };
      }
    };
  }
}
