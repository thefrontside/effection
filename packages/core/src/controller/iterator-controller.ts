import { Controller, Options } from './controller';
import { OperationGenerator } from '../operation';
import { createTask, Task } from '../task';
import { Operation } from '../operation';
import { createFuture, Value } from '../future';

const claimed = Symbol.for('effection/v2/iterator-controller/claimed');

type NextFn = () => IteratorResult<Operation<unknown>>;

interface Claimable {
  [claimed]?: boolean;
}

export function createIteratorController<TOut>(task: Task<TOut>, iterator: OperationGenerator<TOut> & Claimable, options: Options): Controller<TOut> {
  let didHalt = false;
  let yieldingTo: Task | undefined;

  let { produce, future } = createFuture<TOut>();

  function start() {
    if (iterator[claimed]) {
      let error = new Error(`An operation iterator can only be run once in a single task, but it looks like has been either yielded to, or run multiple times`);
      error.name = 'DoubleEvalError';
      produce({ state: 'errored', error });
    } else {
      iterator[claimed] = true;
      resume(() => iterator.next());
    }
  }

  function resume(iter: NextFn) {
    options.runLoop.run(() => {
      let next;
      try {
        next = iter();
      } catch(error) {
        produce({ state: 'errored', error });
        return;
      }
      if(next.done) {
        if(didHalt) {
          produce({ state: 'halted' });
        } else {
          produce({ state: 'completed', value: next.value });
        }
      } else {
        yieldingTo = createTask(next.value, { scope: task.options.yieldScope || task, ignoreError: true });
        yieldingTo.consume(trap);
        yieldingTo.start();
        options.onYieldingToChange && options.onYieldingToChange(yieldingTo);
      }
    });
  }

  function trap(value: Value<unknown>) {
    yieldingTo = undefined;
    options.onYieldingToChange && options.onYieldingToChange(undefined);
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
      if(yieldingTo) {
        yieldingTo.halt();
      } else {
        resume(() => iterator.return(undefined));
      }
    }
  }

  return { start, halt, future, type: 'generator', operation: iterator };
}
