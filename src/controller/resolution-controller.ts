import { Controller } from './controller';
import { OperationResolution } from '../operation';
import { Controls } from '../task';

export class ResolutionController<TOut> implements Controller<TOut> {
  constructor(private controls: Controls<TOut>, private resolution: OperationResolution<TOut>) {
  }

  start() {
    try {
      this.resolution(this.controls.resolve, this.controls.reject);
    } catch(error) {
      this.controls.reject(error);
    }
  }

  halt() {
    this.controls.halted();
  }
}
