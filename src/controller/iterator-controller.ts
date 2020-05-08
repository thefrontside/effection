import { Controller } from './controller';
import { Task } from '../task';
import { HaltError } from '../halt-error';
import { Operation } from '../operation';

type Halt = { halted: true }

function isHalt(value: any): value is Halt {
  return value && value.halted;
}

export class IteratorController<TOut> implements Controller<TOut> {
  private promise: Promise<TOut>;
  private haltPromise: Promise<Halt>;
  private resolveHaltPromise: () => void;

  constructor(private iterator: Iterator<unknown>) {
    this.haltPromise = new Promise((resolve) => {
      this.resolveHaltPromise = () => { resolve({ halted: true }) };
    });

    this.promise = new Promise(async (resolve, reject) => {
      let resume = (value) => () => this.iterator.next(value);
      let fail = (error) => () => this.iterator.throw(error);
      let halt = () => this.iterator.return();
      let getNext: (value?: Operation<unknown> | Error | undefined) => IteratorResult<unknown> = resume(undefined);
      while(true) {
        try {
          let next = getNext();
          if (next.done) {
            resolve(next.value);
            break;
          } else {
            let subTask: Task<unknown> = new Task(next.value);
            try {
              let wrapper = await Promise.race([
                subTask.then((value: unknown) => ({ value })),
                this.haltPromise,
              ]);
              if(isHalt(wrapper)) {
                getNext = halt;
                reject(new HaltError());
              } else {
                getNext = resume(wrapper.value);
              }
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
    this.resolveHaltPromise();
  }

  then<TResult1 = TOut, TResult2 = never>(onfulfilled?: ((value: TOut) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
