import { Task } from '../task';
import type { Controller } from './controller';
import { createFuture } from '../future';
import { Operation } from '../operation';
import { extractLabels } from '../labels';

export function createDelegateController<TOut>(task: Task<TOut>, operation: Operation<TOut>, createController: () => Controller<TOut>): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { produce, future } = createFuture<TOut>();

  function start() {
    try {
      delegate = createController();
      task.setLabels({
        ...extractLabels(delegate.operation),
        ...extractLabels(operation)
      });
    } catch (error) {
      produce({ state: 'errored', error });
      return;
    }
    delegate.future.consume((value) => {
      produce(value);
    });
    delegate.start();
  }

  function halt() {
    delegate?.halt();
  }

  return {
    get type() {
      if(delegate) {
        return delegate.type === 'promise' ? 'async function' : `${delegate.type} function`;
      } else {
        return 'function';
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
