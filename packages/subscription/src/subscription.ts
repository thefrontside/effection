import { Operation, Task } from 'effection';
import { DeepPartial, matcher } from './match';
import { OperationIterator } from './operation-iterator';
import { OperationIterable } from './operation-iterable';
import { SymbolOperationIterable } from './symbol-operation-iterable';

const DUMMY = { next() { throw new Error('dummy') } };

export class Subscription<T,TReturn> implements OperationIterator<T,TReturn> {
  constructor(private iterator: OperationIterator<T, TReturn>) {}

  static of<T, TReturn>(task: Task<unknown>, iterable: OperationIterable<T, TReturn>): Subscription<T, TReturn> {
    let iterator = iterable[SymbolOperationIterable](task);

    return new Subscription(iterator);
  }

  filter(predicate: (value: T) => boolean): Subscription<T, TReturn> {
    let { iterator } = this;
    return new Subscription({
      *next(): Operation<IteratorResult<T,TReturn>> {
        while(true) {
          let result = yield iterator.next();
          if(result.done) {
            return result;
          } else if(predicate(result.value)) {
            return result;
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
      *next() {
        while(true) {
          let result = yield iterator.next();
          if(result.done) {
            return result;
          } else {
            return { done: false, value: mapper(result.value) };
          }
        }
      }
    });
  }

  *first(): Operation<T | undefined> {
    let result: IteratorResult<T,TReturn> = yield this.iterator.next();
    if(result.done) {
      return undefined;
    } else {
      return result.value;
    }
  }

  *expect(): Operation<T> {
    let result: IteratorResult<T,TReturn> = yield this.iterator.next();
    if(result.done) {
      throw new Error('expected subscription to contain a value');
    } else {
      return result.value;
    }
  }

  *forEach(visit: (value: T) => Operation<void>): Operation<TReturn> {
    while (true) {
      let result: IteratorResult<T,TReturn> = yield this.iterator.next();
      if(result.done) {
        return result.value;
      } else {
        yield visit(result.value);
      }
    }
  }

  next() {
    return this.iterator.next();
  }
}
