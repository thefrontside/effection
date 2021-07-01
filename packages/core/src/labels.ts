import { Operation } from './operation';

export type Labels = Record<string, string | number | boolean>;

export function withLabels<T>(operation: Operation<T>, labels: Labels): Operation<T> {
  if(operation) {
    operation.labels = { ...(operation.labels || {}), ...labels };
  }
  return operation;
}
