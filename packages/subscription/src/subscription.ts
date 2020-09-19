import { Operation, Task } from '@effection/core';
import { DeepPartial, matcher } from './match';
import { OperationIterator } from './operation-iterator';
import { OperationIterable } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';
import { Callback, createOperationIterator } from './create-operation-iterator';

export class Subscription<T, TReturn = undefined> implements OperationIterator<T, TReturn> {
  constructor(private iterator: OperationIterator<T, TReturn>) {}

  static create<T, TReturn>(task: Task<unknown>, callback: Callback<T,TReturn>): Subscription<T,TReturn> {
    return new Subscription(createOperationIterator(task, callback));
  }

  static of<T, TReturn>(task: Task<unknown>, iterable: OperationIterable<T, TReturn>): Subscription<T, TReturn> {
    let iterator = iterable[SymbolOperationIterable](task);

    return new Subscription(iterator);
  }

  filter(predicate: (value: T) => boolean): Subscription<T, TReturn> {
    let { iterator } = this;
    return new Subscription({
      next(): Operation<IteratorResult<T,TReturn>> {
        return function*() {
          while(true) {
            let result = yield iterator.next();
            if(result.done) {
              return result;
            } else if(predicate(result.value)) {
              return result;
            }
          }
        }
      }
    });
  }

  match(reference: DeepPartial<T>): Subscription<T,TReturn> {
    return this.filter(matcher(reference));
  }

  map<R>(mapper: (value: T) => R): Subscription<R, TReturn> {
    let { iterator } = this;
    return new Subscription({
      next() {
        return function*() {
          while(true) {
            let result = yield iterator.next();
            if(result.done) {
              return result;
            } else {
              return { done: false, value: mapper(result.value) };
            }
          }
        }
      }
    });
  }

  first(): Operation<T | undefined> {
    let { iterator } = this;
    return function*() {
      let result: IteratorResult<T,TReturn> = yield iterator.next();
      if(result.done) {
        return undefined;
      } else {
        return result.value;
      }
    }
  }

  expect(): Operation<T> {
    let { iterator } = this;
    return function*() {
      let result: IteratorResult<T,TReturn> = yield iterator.next();
      if(result.done) {
        throw new Error('expected subscription to contain a value');
      } else {
        return result.value;
      }
    }
  }

  forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
    let { iterator } = this;
    return function*() {
      while (true) {
        let result: IteratorResult<T,TReturn> = yield iterator.next();
        if(result.done) {
          return result.value;
        } else {
          yield visit(result.value);
        }
      }
    }
  }

  next() {
    return this.iterator.next();
  }
}
