import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { createTask, Task, getControls } from '../task';
import { Operation } from '../operation';

type Continuation = () => IteratorResult<Operation<unknown>>;

const claimed = Symbol.for('effection/v2/iterator-controller/claimed');

interface Claimable {
  [claimed]?: boolean;
}

type Options = {
  resourceTask?: Task;
}

export function createIteratorController<TOut>(task: Task<TOut>, iterator: OperationIterator<TOut> & Claimable, options: Options = {}): Controller<TOut> {
  let didHalt = false;
  let didEnter = false;
  let subTask: Task | undefined;
  let controls = getControls(task);

  let continuations: Continuation[] = [];

  function start() {
    if (iterator[claimed]) {
      let error = new Error(`An operation iterator can only be run once in a single task, but it looks like has been either yielded to, or run multiple times`)
      error.name = 'DoubleEvalError';
      controls.reject(error);
    } else {
      iterator[claimed] = true;
      resume(() => iterator.next());
    }
  }

  // the purpose of this method is solely to make `step` reentrant, that is we
  // should be able to handle a `halt` which occurs while we are already in a
  // generator. This is a rare case and should only happen under some edge
  // cases, for example a task halting itself, or a task causing one of its
  // siblings to fail.
  function resume(iter: Continuation) {
    continuations.push(iter);
    // only enter this loop if we aren't already running it
    if(!didEnter) {
      didEnter = true; // acquire lock
      // use while loop since collection can be modified during iteration
      let continuation;
      while(continuation = continuations.shift()) {
        step(continuation);
      }
      didEnter = false; // release lock
    }
  }

  function step(iter: Continuation) {
    let next;
    try {
      next = iter();
    } catch(error) {
      controls.reject(error);
      return;
    }
    if(next.done) {
      if(didHalt) {
        controls.halted();
      } else {
        controls.resolve(next.value);
      }
    } else {
      subTask = createTask(next.value, { parent: options.resourceTask || task, ignoreError: true });
      getControls(task).link(subTask);
      getControls(subTask).addTrapper(trap);
      getControls(subTask).start();
    }
  }

  function trap(child: Task) {
    subTask = undefined;
    if(child.state === 'completed') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resume(() => iterator.next(getControls(child).result!));
    }
    if(child.state === 'errored') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resume(() => iterator.throw(getControls(child).error!));
    }
    if(child.state === 'halted') {
      resume(() => iterator.return(undefined));
    }
  }

  function halt() {
    if(!didHalt) {
      didHalt = true;
      if(subTask) {
        subTask.halt();
      } else {
        resume(() => iterator.return(undefined));
      }
    }
  }

  return { start, halt };
}
