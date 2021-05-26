import { getControls } from '../task';
import { Resource } from '../operation';
import { Labels } from '../labels';

export function setLabels(labels: Labels): Resource<void> {
  return {
    *init(scope) {
      getControls(scope).setLabels(labels);
    }
  }
}
