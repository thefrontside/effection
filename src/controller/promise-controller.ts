import { Controller } from './controller';
import { Controls } from '../task';
import { HaltError, isHaltError } from '../halt-error';
import { Deferred } from '../deferred';

export class PromiseController<TOut> implements Controller<TOut> {
  // TODO: to prevent memory leaks of tasks if a promise never resolves, but
  // the task is halted, we should retain the task through a weak reference.

  private haltSignal = Deferred<never>();

  constructor(private controls: Controls<TOut>, private promise: PromiseLike<TOut>) {
  }

  start() {
    Promise.race([this.promise, this.haltSignal.promise]).then(
      (value) => {
        this.controls.resolve(value);
      },
      (error) => {
        if(isHaltError(error)) {
          this.controls.resume();
        } else {
          this.controls.reject(error);
        }
      }
    )
  }

  halt() {
    this.haltSignal.reject(new HaltError());
  }
}
