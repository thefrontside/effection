import { Controller } from './controller';
import { Controls } from '../task';

export class SuspendController<TOut> implements Controller<TOut> {
  constructor(private controls: Controls<TOut>) {
  }

  start() {}

  halt() {
    this.controls.resume();
  }
}
