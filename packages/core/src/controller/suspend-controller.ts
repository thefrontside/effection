import { Controller } from './controller';
import { Controls } from '../task';

export class SuspendController<TOut> implements Controller<TOut> {
  constructor(private controls: Controls<TOut>) {
  }

  start() {
    // no op
  }

  halt() {
    this.controls.halted();
  }
}
