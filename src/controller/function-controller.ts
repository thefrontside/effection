import { Controller } from './controller';
import { OperationFunction } from '../operation';
import { Task } from '../task';
import { HaltError } from '../halt-error';
import { Deferred } from '../deferred';
import { isPromise } from '../predicates';
import { IteratorController } from './iterator-controller';
import { PromiseController } from './promise-controller';

const HALT = Symbol("halt");

export class FunctionContoller<TOut> implements Controller<TOut> {
  private haltSignal: Deferred<typeof HALT> = Deferred();
  private startSignal: Deferred<{ controller: Controller<TOut> }> = Deferred();
  private controller?: Controller<TOut>;

  constructor(private task: Task<TOut>, private operation: OperationFunction<TOut>) {
  }

  start() {
    let result;
    try {
      result = this.operation(this.task);
    } catch(error) {
      this.task.trapReject(error);
      return;
    }
    let controller;
    if(isPromise(result)) {
      controller = new PromiseController(this.task, result);
    } else {
      controller = new IteratorController(this.task, result);
    }
    this.controller = controller;
    controller.start();
  }

  async halt() {
    if(this.controller) {
      this.controller.halt();
    } else {
      throw new Error('INTERNAL ERROR: halt called before start, this should never happen');
    }
  }
}
