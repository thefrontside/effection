import { Operation } from '@effection/core';

type Waiter<T> = (value: T) => void;

interface Queue<T> {
  push(value: T): void;
  pop(): Operation<T>;
}

export function createQueue<T>(): Queue<T> {
  let waiters: Waiter<T>[] = [];
  let values: T[] = [];

  return {
    push(value: T): void {
      let next = waiters.pop();
      if (next) {
        next(value);
      } else {
        values.push(value);
      }
    },

    pop(): Operation<T> {
      return function*() {
        if(values.length) {
          return values.shift();
        } else {
          let res;
          try {
            return yield () => (resolve) => {
              res = resolve;
              waiters.push(resolve);
            }
          } finally {
            if(res) {
              let index = waiters.indexOf(res);
              if (index > -1) {
                waiters.splice(index, 1);
              }
            }
          }
        }
      }
    }
  }
}
