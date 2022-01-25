import { Operation } from './operation';
import { isObjectOperation } from './predicates';
import { Symbol } from './symbol';

/**
 * A map of labels. Each label is a key/value pair, where the key must be a
 * string and the value may be a string, number or boolean.
 */
export type Labels = Record<string, string | number | boolean>;

/**
 * Apply the given labels to an operation. When the operation is run as a task,
 * using {@link run} or {@link spawn}, the labels get applied to the task as
 * well.
 *
 * If the task operation already has labels, the existing labels are not
 * removed. See {@link setLabels} if you want to replace the existing labels
 * entirely.
 */
export function withLabels<T>(operation: Operation<T>, labels: Labels): Operation<T> {
  if (isObjectOperation<T>(operation)) {
    let original = operation[Symbol.operation];
    return Object.assign(operation, {
      ...labels,
      [Symbol.operation]: original
    });
  } else if (operation) {
    operation.labels = { ...(operation.labels || {}), ...labels };
  }
  return operation;
}

/**
 * Like {@link withLabels}, but replaces the existing labels entirely.
 */
export function setLabels<T>(operation: Operation<T>, labels: Labels): Operation<T> {
  if (isObjectOperation<T>(operation)) {
    let original = operation[Symbol.operation];
    operation = {
      ...labels,
      [Symbol.operation]: original
    } as Operation<T>;
  } else if (operation) {
    operation.labels = labels;
  }
  return operation;
}

export function extractLabels<T>(operation: Operation<T>): Labels | undefined {
  if (!isObjectOperation<T>(operation)) {
    return {
      ...(operation?.name ? { name: operation?.name }: null),
      ...operation?.labels
    };
  }
  let labels: Labels = {};
  for (let key in operation) {
    let value = operation[key];
    if (typeof value == 'string'
    || typeof value == 'number'
    || typeof value == 'boolean')
      labels[key] = value;
  }
  return labels;
}
