export class Semaphore<T> {
  waiters: Array<(value: T) => void> = [];

  signal = (value: T) => {
    let next = this.waiters.pop();
    if (next) {
      next(value);
    }
  }

  wait = () => new Promise<T>(resolve => this.waiters.push(resolve));
}
