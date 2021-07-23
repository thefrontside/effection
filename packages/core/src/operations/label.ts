import { Resource } from '../operation';
import { Labels } from '../labels';

export function label(labels: Labels): Resource<void> {
  return {
    name: 'label',
    *init(scope) {
      scope.setLabels(labels);
    }
  };
}
