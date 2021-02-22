import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { Task, Controls } from '../task';
import { HaltError, swallowHalt } from '../halt-error';
import { Operation } from '../operation';
import { Trapper } from '../trapper';

export class IteratorController<TOut> implements Controller<TOut>, Trapper {
  private didHalt: boolean = false;
  private subTask?: Task;

  constructor(private controls: Controls<TOut>, private iterator: OperationIterator<TOut>) {
  }

  // make this an async function to delay the first iteration until the next event loop tick
  async start() {
    this.resume(() => this.iterator.next());
  }

  resume(iter: () => IteratorResult<Operation<unknown>>) {
    let next;
    try {
      next = iter();
    } catch(error) {
      this.controls.reject(error);
      return;
    }
    if(next.done) {
      if(this.didHalt) {
        this.controls.resume();
      } else {
        this.controls.resolve(next.value);
      }
    } else {
      this.subTask = new Task(next.value);
      this.subTask.addTrapper(this);
      this.subTask.start();
    }
  }

  trap(child: Task) {
    if(child.state === 'completed') {
      this.resume(() => this.iterator.next(child.result!));
    }
    if(child.state === 'errored') {
      this.resume(() => this.iterator.throw(child.error!));
    }
    if(child.state === 'halted') {
      this.resume(() => this.iterator.throw(new HaltError()));
    }
  }

  halt() {
    if(!this.didHalt) {
      this.didHalt = true;
      if(this.subTask) {
        this.subTask.removeTrapper(this);
        this.subTask.halt();
      }
      this.resume(() => this.iterator.return(undefined));
    }
  }
}
