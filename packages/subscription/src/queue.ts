import { Operation, withLabels, createFuture } from '@effection/core';
import { Subscription, Sink, Close } from './index';

type Waiter<T, TReturn> = (value: IteratorResult<T, TReturn>) => void;

export interface Queue<T, TReturn = undefined> extends Subscription<T, TReturn>, Sink<T, TReturn> {
  subscription: Subscription<T, TReturn>;
}

export function createQueue<T, TReturn = undefined>(name = 'queue'): Queue<T, TReturn> {
  let waiters: Waiter<T, TReturn>[] = [];
  let values: IteratorResult<T, TReturn>[] = [];
  let didClose = false;

  let send = function*(value: T): Operation<void> {
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

  let close = function*(value: TReturn): Operation<void> {
    if(didClose) {
      new Error('tried to close an already closed queue');
    }

    let next = waiters.pop();
    if (next) {
      next({ value, done: true });
    } else {
      values.push({ value, done: true });
    }
  } as Close<TReturn>;

  let next = (): Operation<IteratorResult<T, TReturn>> => {
    return withLabels((task) => {
      let { future, resolve } = createFuture<IteratorResult<T, TReturn>>();
      if(values.length) {
        resolve(values.shift() as IteratorResult<T, TReturn>);
      } else {
        waiters.push(resolve);
        task.consume(() => {
          let index = waiters.indexOf(resolve);
          if(index > -1) {
            waiters.splice(index, 1);
          }
        });
      }
      return future;
    }, { name: `${name}.next()` });
  };

  function withName<T>(operationName: string, operation: Operation<T>): Operation<T> {
    return withLabels(operation, { name: `${name}.${operationName}()`, expand: false });
  }

  let subscription = {
    next,
    close,
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
        let result = yield subscription.forEach((item) => function*() { items.push(item) });
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
  };

  return {
    send,
    subscription,
    ...subscription,
  };
}
