import { Controller } from './controller';
import { Task } from '../task';
import { HaltError, isHaltError } from '../halt-error';
import { Deferred } from '../deferred';

export class PromiseController<TOut> implements Controller<TOut> {
  // TODO: to prevent memory leaks of tasks if a promise never resolves, but
  // the task is halted, we should retain the task through a weak reference.

  private haltSignal = Deferred<never>();

  constructor(private task: Task<TOut>, private promise: PromiseLike<TOut>) {
  }

  start() {
    Promise.race([this.promise, this.haltSignal.promise]).then(
      (value) => {
        this.task.trapResolve(value);
      },
      (error) => {
        if(isHaltError(error)) {
          this.task.trapHalt();
        } else {
          this.task.trapReject(error);
        }
      }
    )
  }

  halt() {
    this.haltSignal.reject(new HaltError());
  }
}
