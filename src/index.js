export { timeout } from './timeout';
export { fork, join } from './control';

import { ExecutionContext } from './context';

export function enter(operation, options) {
  let top = new ExecutionContext(null, options);
  top.enter(operation);
  return top;
}
