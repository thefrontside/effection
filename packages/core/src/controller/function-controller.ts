import { Controller } from './controller';
import { OperationFunction, OperationResolution } from '../operation';
import { Task, Controls } from '../task';
import { isPromise } from '../predicates';
import { IteratorController } from './iterator-controller';
import { ResolutionController } from './resolution-controller';
import { PromiseController } from './promise-controller';

export class FunctionContoller<TOut> implements Controller<TOut> {
  private controller?: Controller<TOut>;

  constructor(private controls: Controls<TOut>, private operation: OperationFunction<TOut>) {
  }

  start(task: Task<TOut>) {
    let result;
    try {
      result = this.operation(task);
    } catch(error) {
      this.controls.reject(error);
      return;
    }
    let controller;
    if(isPromise(result)) {
      controller = new PromiseController(this.controls, result);
    } else if (isRunnable(result)) {
      controller = new ResolutionController(this.controls, result);
    } else {
      controller = new IteratorController(this.controls, result);
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

function isRunnable<T>(value: unknown): value is OperationResolution<T> {
  return !!(value as OperationResolution<T>).perform;
}
