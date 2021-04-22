import { Controls, Task } from '../task';
import { Controller } from './controller';

export class FunctionController<T> implements Controller<T> {
  delegate?: Controller<T>;

  constructor(public controls: Controls<T>, public createController: () => Controller<T>) {}

  start(task: Task<T>) {
    try {
      this.delegate = this.createController();
    } catch (error) {
      this.controls.reject(error);
    }
    this.delegate?.start(task);
  }

  halt() {
    if (!this.delegate) {
      throw new Error(`EFFECTION INTERNAL ERROR halt() called before start()`);
    }
    this.delegate.halt();
  }
}
