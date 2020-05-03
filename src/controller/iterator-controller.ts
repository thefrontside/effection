import { Controller } from './controller';
import { Task } from '../task';
import { HaltError } from '../halt-error';

export class IteratorController<TOut> implements Controller<TOut> {
  private currentTask: Task<unknown> | undefined;
  private promise: Promise<TOut>;

  constructor(private iterator: Iterator<unknown>) {
    this.promise = new Promise(async (resolve, reject) => {
      let resume = (value) => () => this.iterator.next(value);
      let fail = (error) => () => this.iterator.throw(error);
      let halt = () => this.iterator.return();
      let getNext = resume(undefined);
      while(true) {
        try {
          let next = getNext();
          if (next.done) {
            resolve(next.value);
            break;
          } else {
            this.currentTask = new Task(next.value);
            try {
              let value = await this.currentTask;
              getNext = resume(value);
            } catch(error) {
              getNext = fail(error)
            }
          }
        } catch (error) {
          reject(error)
        }
      }
    });
  }

  halt() {
    if(!this.currentTask) {
      this.currentTask.halt();
    }
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
