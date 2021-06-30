import { Operation, Labelled } from './operation';

export type Labels = Record<string, string | number | boolean>;

export function withLabels<T>(operation: Operation<T>, labels: Labels): Operation<T>;
export function withLabels<T extends Labelled>(labelled: T, labels: Labels): T {
  if(labelled) {
    labelled.labels = { ...(labelled.labels || {}), ...labels };
  }
  return labelled;
}
