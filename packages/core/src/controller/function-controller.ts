import { Task } from '../task';
import { Controller } from './controller';
import { createFuture } from '../future';
import { OperationFunction } from '../operation';
import { extractLabels, Labels } from '../labels';
import { isNotObjectOperation, isObjectOperation } from '../predicates';

export function createFunctionController<TOut>(task: Task<TOut>, fn: OperationFunction<TOut>, createController: () => Controller<TOut>): Controller<TOut> {
  let delegate: Controller<TOut>;
  let { produce, future } = createFuture<TOut>();

  function start() {
    try {
      delegate = createController();
      let labels: Labels = {};
      if (isObjectOperation<TOut>(delegate.operation)) labels = extractLabels(delegate.operation);
      if (isNotObjectOperation<TOut>(delegate.operation)) labels = delegate.operation?.labels ?? {};
      task.setLabels({
        ...labels,
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
    get resourceTask() {
      return delegate?.resourceTask;
    },
    future,
    start,
    halt,
  };
}
