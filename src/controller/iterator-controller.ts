import { Controller } from './controller';
import { Task } from '../task';
import { HaltError } from '../halt-error';
import { Operation } from '../operation';

export class IteratorController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltPromise: Promise<undefined>;
  private resolveHaltPromise: () => void;

  constructor(private iterator: Iterator<unknown>) {
    this.haltPromise = new Promise((resolve) => {
      this.resolveHaltPromise = () => { resolve() };
    });

    this.promise = this.run();
  }

  private async run(): Promise<TOut> {
    let didHalt = false;
    let resume = (value) => () => this.iterator.next(value);
    let fail = (error) => () => this.iterator.throw(error);
    let halt = () => this.iterator.return();
    let getNext: (value?: Operation<unknown> | Error | undefined) => IteratorResult<unknown> = resume(undefined);

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
              getNext = resume(value)
            },
            (error) => {
              getNext = fail(error)
            }
          ),
          this.haltPromise.then(
            () => {
              didHalt = true;
              getNext = halt;
            }
          ),
        ]);
      }
    }
  }

  halt() {
    this.resolveHaltPromise();
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
