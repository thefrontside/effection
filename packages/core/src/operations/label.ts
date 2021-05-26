import { getControls } from '../task';
import { Resource } from '../operation';
import { Labels } from '../labels';

export function label(labels: Labels): Resource<void> {
  return {
    name: 'label',
    *init(scope) {
      getControls(scope).setLabels(labels);
    }
  }
}
