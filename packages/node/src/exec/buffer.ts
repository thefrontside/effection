import { SymbolSubscribable, createSubscription } from '@effection/subscription';

export class Buffer<T> {
  contents: T[] = [];
  semaphore = new Semaphore();

  send(message: T): void {
    this.contents.unshift(message);
    this.semaphore.signal();
  }

  *[SymbolSubscribable]() {
    let { contents, semaphore } = this;
    return yield createSubscription<T, void>(function*(publish) {
      while (true) {
        let message = contents.pop();
        if (message) {
          publish(message)
        } else {
          yield semaphore.wait()
        }
      }
    })
  }
}

export class Semaphore<T = void> {
  waiters: Array<(value: T) => void> = [];

  signal = (value: T) => {
    let next = this.waiters.pop();
    if (next) {
      next(value);
    }
  }

  wait = () => new Promise<T>(resolve => this.waiters.push(resolve));
}
