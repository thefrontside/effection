import { Controller } from './controller';
import { Task } from '../task';
import { createFuture } from '../future';
import { extractLabels } from '../labels';
import { Operation } from '../operation';
import { UnknownOperationTypeError } from '../error';

export function createPromiseController<TOut>(task: Task<TOut>, promise: PromiseLike<TOut>, createController: (value: Operation<TOut>) => Controller<TOut>): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { produce, future } = createFuture<TOut>();

  function start() {
    Promise.race([promise, future]).then(
      (value) => {
        if (!value) {
          produce({ state: 'completed', value });
        }
        try {
          delegate = createController(value as unknown as Operation<TOut>);
          task.setLabels({
            ...extractLabels(delegate.operation),
            ...extractLabels(promise)
          });
        } catch (error) {
          produce({ state: 'errored', error });
          return;
        }
        delegate.future.consume((futureValue) => {
          if (futureValue.state == 'errored' && futureValue.error instanceof UnknownOperationTypeError) {
            produce({ state: 'completed', value });
          } else {
            produce(futureValue);
          }
        });
        delegate.start();
      },
      (error) => {
        produce({ state: 'errored', error });
      }
    );
  }

  function halt() {
    if (delegate) {
      delegate.halt();
    } else {
      produce({ state: 'halted' });
    }
  }

  return {
    get type() {
      if(delegate) {
        return delegate.type;
      } else {
        return 'promise';
      }
    },
    get operation() {
      return delegate?.operation;
    },
    get resourceTask() {
      return delegate?.resourceTask;
    },
    future,
    start,
    halt,
  };
}
