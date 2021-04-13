import { Operation } from '@effection/core';
import { Subscription } from './index';

type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

type Waiter<T, TReturn> = (value: IteratorResult<T, TReturn>) => void;

export interface Queue<T, TReturn = undefined> extends Subscription<T, TReturn> {
  send(value: T): void;
  close: Close<TReturn>;
  closeWith(value: TReturn): void;
  subscription: Subscription<T, TReturn>;
}

export function createQueue<T, TReturn = undefined>(): Queue<T, TReturn> {
  let waiters: Waiter<T, TReturn>[] = [];
  let values: IteratorResult<T, TReturn>[] = [];
  let didClose = false;

  let send = (value: T): void => {
    if(didClose) {
      new Error(`tried to publish a value: ${value} on an already finished queue`);
    }

    let next = waiters.pop();
    if (next) {
      next({ value, done: false });
    } else {
      values.push({ value, done: false });
    }
  };

  let close = (value: TReturn) => {
    if(didClose) {
      new Error('tried to close an already closed queue');
    }

    let next = waiters.pop();
    if (next) {
      next({ value, done: true });
    } else {
      values.push({ value, done: true });
    }
  }

  let next = (): Operation<IteratorResult<T, TReturn>> => {
    return (task) => ({
      perform: (resolve) => {
        if(values.length) {
          resolve(values.shift() as IteratorResult<T, TReturn>);
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
    })
  };

  let subscription = {
    next,
    close: ((...args) => close(args[0] as TReturn)) as Close<TReturn>,
    closeWith: close,
    first(): Operation<T | undefined> {
      return function*() {
        let result: IteratorResult<T, TReturn> = yield next();
        if(result.done) {
          return undefined;
        } else {
          return result.value;
        }
      }
    },

    expect(): Operation<T> {
      return function*() {
        let result: IteratorResult<T, TReturn> = yield next();
        if(result.done) {
          throw new Error('expected to contain a value');
        } else {
          return result.value;
        }
      }
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return function*() {
        while (true) {
          let result: IteratorResult<T,TReturn> = yield next();
          if(result.done) {
            return result.value;
          } else {
            let operation = visit(result.value);
            if(operation) {
              yield operation;
            }
          }
        }
      }
    },

    join(): Operation<TReturn> {
      return subscription.forEach(() => { /* no op */ });
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return function*() {
        let items: T[] = [];
        let result = yield subscription.forEach((item) => function*() { items.push(item); });
        return (function*() {
          yield *items;
          return result;
        })();
      }
    },

    toArray(): Operation<T[]> {
      return function*() {
        return Array.from<T>(yield subscription.collect());
      }
    },
  }

  return {
    send,
    subscription,
    ...subscription,
  }
}
