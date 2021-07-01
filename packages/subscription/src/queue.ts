import { Operation, withLabels } from '@effection/core';
import { Subscription } from './index';

type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

type Waiter<T, TReturn> = (value: IteratorResult<T, TReturn>) => void;

export interface Queue<T, TReturn = undefined> extends Subscription<T, TReturn> {
  send(value: T): void;
  close: Close<TReturn>;
  closeWith(value: TReturn): void;
  subscription: Subscription<T, TReturn>;
}

export function createQueue<T, TReturn = undefined>(name: string = 'queue'): Queue<T, TReturn> {
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
    return {
      name: `${name}.next()`,
      perform(resolve) {
        if(values.length) {
          resolve(values.shift() as IteratorResult<T, TReturn>);
        } else {
          waiters.push(resolve);
          return () => {
            let index = waiters.indexOf(resolve);
            if(index > -1) {
              waiters.splice(index, 1);
            }
          };
        }
      }
    }
  };

  function withName<T>(operationName: string, operation: Operation<T>): Operation<T> {
    return withLabels(operation, { name: `${name}.${operationName}()`});
  }

  let subscription = {
    next,
    close: ((...args) => close(args[0] as TReturn)) as Close<TReturn>,
    closeWith: close,
    first(): Operation<T | undefined> {
      return withName<T | undefined>(`first`, function*() {
        let result: IteratorResult<T, TReturn> = yield next();
        if(result.done) {
          return undefined;
        } else {
          return result.value;
        }
      });
    },

    expect(): Operation<T> {
      return withName('expect', function*() {
        let result: IteratorResult<T, TReturn> = yield next();
        if(result.done) {
          throw new Error('expected to contain a value');
        } else {
          return result.value;
        }
      });
    },

    forEach(visit: (value: T) => (Operation<void> | void)): Operation<TReturn> {
      return withName('forEach', function* forEach() {
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
      });
    },

    join(): Operation<TReturn> {
      return withName('join', subscription.forEach(() => { /* no op */ }));
    },

    collect(): Operation<Iterator<T, TReturn>> {
      return withName<Iterator<T, TReturn>>('collect', function*() {
        let items: T[] = [];
        let result = yield subscription.forEach((item) => function*() { items.push(item); });
        return (function*() {
          yield *items;
          return result;
        })();
      });
    },

    toArray(): Operation<T[]> {
      return withName('toArray', function*() {
        return Array.from<T>(yield subscription.collect());
      });
    },
  }

  return {
    send,
    subscription,
    ...subscription,
  }
}
