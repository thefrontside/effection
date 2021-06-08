import { Controller } from './controller';
import { OperationIterator } from '../operation';
import { createTask, Task } from '../task';
import { Operation } from '../operation';
import { createFuture, Value } from '../future';
import { createRunLoop } from '../run-loop';

const claimed = Symbol.for('effection/v2/iterator-controller/claimed');

type NextFn = () => IteratorResult<Operation<unknown>>;

interface Claimable {
  [claimed]?: boolean;
}

type Options = {
  resourceScope?: Task;
}

export function createIteratorController<TOut>(task: Task<TOut>, iterator: OperationIterator<TOut> & Claimable, options: Options = {}): Controller<TOut> {
  let didHalt = false;
  let subTask: Task | undefined;

  let { resolve, future } = createFuture<TOut>();
  let runLoop = createRunLoop();

  function start() {
    if (iterator[claimed]) {
      let error = new Error(`An operation iterator can only be run once in a single task, but it looks like has been either yielded to, or run multiple times`)
      error.name = 'DoubleEvalError';
      resolve({ state: 'errored', error });
    } else {
      iterator[claimed] = true;
      resume(() => iterator.next());
    }
  }

  function resume(iter: NextFn) {
    runLoop.run(() => {
      let next;
      try {
        next = iter();
      } catch(error) {
        resolve({ state: 'errored', error });
        return;
      }
      if(next.done) {
        if(didHalt) {
          resolve({ state: 'halted' });
        } else {
          resolve({ state: 'completed', value: next.value });
        }
      } else {
        subTask = createTask(next.value, { resourceScope: options.resourceScope || task, ignoreError: true });
        subTask.future.consume(trap);
        subTask.start();
      }
    });
  }

  function trap(value: Value<unknown>) {
    subTask = undefined;
    if(value.state === 'completed') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resume(() => iterator.next(value.value));
    }
    if(value.state === 'errored') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resume(() => iterator.throw(value.error));
    }
    if(value.state === 'halted') {
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

  return { start, halt, future, type: 'generator' };
}
