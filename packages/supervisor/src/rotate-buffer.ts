export class RotateBuffer<T> {
  private buffer: T[];
  private current: number;

  constructor(public size: number) {
    this.buffer = new Array(size);
    this.current = 0;
  }

  push(value: T): T | undefined {
    let oldValue = this.buffer[this.current];
    this.buffer[this.current] = value;
    this.current = (this.current + 1) % this.size;
    return oldValue;
  }
}
