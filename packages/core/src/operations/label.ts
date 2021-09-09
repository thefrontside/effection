import { Operation } from '../operation';
import { Labels } from '../labels';
import { Future } from '../future';
import { withLabels } from '../labels';

export function label(labels: Labels): Operation<void> {
  return withLabels((task) => {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `label` on a task without scope');
    }
    scope.setLabels(labels);
    return Future.resolve(undefined);
  }, { name: 'label' });
}
