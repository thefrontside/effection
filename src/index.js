export { timeout } from './timeout';
export { fork, join, monitor } from './control';

import { ExecutionContext } from './context';

export function main(operation) {
  let top = new ExecutionContext();
  top.enter(operation);
  return top;
}
