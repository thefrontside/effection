import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { Task, Controls } from '../task';
import { HaltError } from '../halt-error';
import { Operation } from '../operation';
import { Trapper } from '../trapper';

type Continuation = () => IteratorResult<Operation<unknown>>;

export class IteratorController<TOut> implements Controller<TOut>, Trapper {
  private didHalt = false;
  private didEnter = false;
  private subTask?: Task;

  private continuations: Continuation[] = [];

  constructor(private controls: Controls<TOut>, private iterator: OperationIterator<TOut>) {
  }

  // make this an async function to delay the first iteration until the next event loop tick
  async start() {
    this.resume(() => this.iterator.next());
  }

  // the purpose of this method is solely to make `step` reentrant, that is we
  // should be able to handle a `halt` which occurs while we are already in a
  // generator. This is a rare case and should only happen under some edge
  // cases, for example a task halting itself, or a task causing one of its
  // siblings to fail.
  resume(iter: Continuation) {
    if(this.didEnter) {
      // if we're already in a `step`, store the continuation for later instead
      // of running it immediately.
      this.continuations.push(iter);
    } else {
      this.didEnter = true; // acquire lock
      this.step(iter);
      this.didEnter = false; // release lock

      // resume with stored continuation it happened while we were in the step
      let continuation = this.continuations.shift();
      if(continuation) {
        this.resume(continuation)
      }
    }
  }

  step(iter: Continuation) {
    let next;
    try {
      next = iter();
    } catch(error) {
      this.controls.reject(error);
      return;
    }
    if(next.done) {
      if(this.didHalt) {
        this.controls.halted();
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.resume(() => this.iterator.next(child.result!));
    }
    if(child.state === 'errored') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
