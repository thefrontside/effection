import { Controller } from './controller';
import { Controls } from '../task';
import { HaltError, isHaltError } from '../halt-error';
import { Deferred } from '../deferred';

const HALT = Symbol("halt");

export class PromiseController<TOut> implements Controller<TOut> {
  // TODO: to prevent memory leaks of tasks if a promise never resolves, but
  // the task is halted, we should retain the task through a weak reference.

  private haltSignal = Deferred<typeof HALT>();

  constructor(private controls: Controls<TOut>, private promise: PromiseLike<TOut>) {
  }

  start() {
    Promise.race([this.promise, this.haltSignal.promise]).then(
      (value) => {
        if(value === HALT) {
          this.controls.halted();
        } else {
          this.controls.resolve(value);
        }
      },
      (error) => {
        this.controls.reject(error);
      }
    )
  }

  halt() {
    this.haltSignal.resolve(HALT);
  }
}
