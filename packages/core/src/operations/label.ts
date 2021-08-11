import { Operation } from '../operation';
import { Labels } from '../labels';
import { createFuture } from '../future';
import { withLabels } from '../labels';

export function label(labels: Labels): Operation<void> {
  return withLabels((task) => {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `label` on a task without scope');
    }
    scope.setLabels(labels);
    let { future, produce } = createFuture<undefined>();
    produce({ state: 'completed', value: undefined });
    return future;
  }, { name: 'label' });
}
