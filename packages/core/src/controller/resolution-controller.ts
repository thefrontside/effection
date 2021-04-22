import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Controls } from '../task';

export class ResolutionController<TOut> implements Controller<TOut> {
  constructor(private controls: Controls<TOut>, private resolution: OperationResolution<TOut>) {
  }

  start() {
    let { controls } = this;

    try {
      let atExit = this.resolution.perform(this.controls.resolve, this.controls.reject);
      if (atExit) {
        controls.ensure(atExit);
      }
    } catch(error) {
      this.controls.reject(error);
    }
  }

  halt() {
    this.controls.halted();
  }
}
