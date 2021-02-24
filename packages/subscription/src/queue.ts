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
      return (task) => (resolve) => {
        if(values.length) {
          resolve(values.shift() as T);
        } else {
          task.ensure(() => {
            let index = waiters.indexOf(resolve);
            if(index > -1) {
              waiters.splice(index, 1);
            }
          });
          waiters.push(resolve);
        }
      }
    }
  }
}
