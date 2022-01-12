import { Labels } from "../labels";
import { OperationObject } from "../operation";

export function extractLabels<T>(obj: OperationObject<T>): Labels {
  let labels: Labels = {};
  for (let key in obj) {
    let value = obj[key];
    if (typeof value == 'string'
    || typeof value == 'number'
    || typeof value == 'boolean')
      labels[key] = value;
  }
  return labels;
}
