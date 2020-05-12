import { Controller } from './controller';
import { Task } from '../task';
import { HaltError, swallowHalt } from '../halt-error';
import { Operation } from '../operation';

const HALT = Symbol("halt");

export class IteratorController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltPromise: Promise<Symbol>;
  private resolveHaltPromise: () => void;

  constructor(private iterator: Iterator<Operation<unknown>, TOut, any>) {
    this.haltPromise = new Promise((resolve) => {
      this.resolveHaltPromise = () => { resolve(HALT) };
    });

    this.promise = this.run();
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
        let subTask: Task<unknown> = new Task(next.value);
        let result;

        try {
          result = await Promise.race([subTask, this.haltPromise]);
        } catch(error) {
          getNext = () => this.iterator.throw(error);
          continue;
        }

        if(!didHalt && result === HALT) {
          didHalt = true;
          getNext = () => this.iterator.return();
          await subTask.halt().catch(swallowHalt);
        } else {
          getNext = () => this.iterator.next(result);
        }
      }
    }
  }

  async halt() {
    this.resolveHaltPromise();
    await this.promise.catch(swallowHalt);
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
