export { timeout } from './timeout';
export { fork, join } from './control';

import { ExecutionContext } from './context';

export function spawn(operation) {
  let top = new ExecutionContext();
  top.enter(operation);
  return top;
}
