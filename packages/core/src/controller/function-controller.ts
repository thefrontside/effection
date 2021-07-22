import { Task } from '../task';
import { Controller } from './controller';
import { createFuture } from '../future';
import { OperationFunction } from '../operation';

export function createFunctionController<TOut>(task: Task<TOut>, fn: OperationFunction<TOut>, createController: () => Controller<TOut>) {
  let delegate: Controller<TOut>;
  let { produce, future } = createFuture<TOut>();

  function start() {
    try {
      delegate = createController();
      task.setLabels({
        ...task.labels,
        ...delegate.operation?.labels,
        ...fn.labels
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
    future,
    start,
    halt,
  }
}
