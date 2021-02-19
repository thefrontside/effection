import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { Task } from '../task';
import { HaltError, swallowHalt } from '../halt-error';
import { Operation } from '../operation';
import { Deferred } from '../deferred';

const HALT = Symbol("halt");

export class IteratorController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltSignal: Deferred<Symbol> = Deferred();
  private startSignal: Deferred<{ iterator: OperationIterator<TOut> }> = Deferred();

  constructor(private iterator: OperationIterator<TOut>) {
    this.promise = this.run();
  }

  start() {
  }

  private async run(): Promise<TOut> {
    let didHalt = false;
    let getNext: () => IteratorResult<unknown> = () => this.iterator.next();

    while(true) {
      let next;
      next = getNext();
      if (next.done) {
        if(didHalt) {
          throw new HaltError()
        } else {
          return next.value;
        }
      } else {
        let subTask = new Task(next.value);
        let result: unknown | Symbol;

        try {
          result = await Promise.race([subTask, this.haltSignal.promise]);
        } catch(error) {
          getNext = () => this.iterator.throw(error);
          continue;
        }

        if(!didHalt && result === HALT) {
          didHalt = true;
          getNext = () => this.iterator.return(undefined);
          await subTask.halt().catch(swallowHalt);
        } else {
          getNext = () => this.iterator.next(result);
        }
      }
    }
  }

  async halt() {
    this.haltSignal.resolve(HALT);
    await this.promise.catch(swallowHalt);
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TOut | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<TOut> {
    return this.promise.finally(onfinally);
  }

  get [Symbol.toStringTag](): string {
    return '[IteratorController]'
  }
}
