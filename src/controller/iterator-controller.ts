import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { Task } from '../task';
import { HaltError, swallowHalt } from '../halt-error';
import { Operation } from '../operation';
import { Deferred } from '../deferred';
import { Trapper } from '../trapper';

const HALT = Symbol("halt");

export class IteratorController<TOut> implements Controller<TOut>, Trapper {
  private didHalt: boolean = false;

  constructor(private task: Task<TOut>, private iterator: OperationIterator<TOut>) {
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
      this.task.reject(error);
      return;
    }
    if(next.done) {
      if(this.didHalt) {
        this.task.resume();
      } else {
        this.task.resolve(next.value);
      }
    } else {
      let subTask = new Task(next.value);
      subTask.parent = this;
      subTask.start();
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
      this.resume(() => this.iterator.return(undefined));
    }
  }
}
