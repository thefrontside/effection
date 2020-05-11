import { Controller } from './controller';
import { Task } from '../task';
import { HaltError, isHaltError } from '../halt-error';
import { Operation } from '../operation';

export class IteratorController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltPromise: Promise<undefined>;
  private resolveHaltPromise: () => void;

  constructor(private iterator: Iterator<Operation<unknown>, TOut, any>) {
    this.haltPromise = new Promise((resolve) => {
      this.resolveHaltPromise = () => { resolve() };
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
        await Promise.race([
          subTask.then(
            (value) => {
              getNext = () => this.iterator.next(value);
            },
            (error) => {
              getNext = () => this.iterator.throw(error);
            }
          ),
          this.haltPromise.then(
            () => {
              didHalt = true;
              getNext = () => this.iterator.return();
            }
          ),
        ]);
      }
    }
  }

  async halt() {
    this.resolveHaltPromise();
    try {
      await this.promise;
    } catch(e) {
      if(!isHaltError(e)) {
        throw e
      }
    }
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
