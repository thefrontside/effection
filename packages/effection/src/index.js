export { timeout } from './timeout';
export { fork, join, spawn, spawn as monitor } from './control';

export { ExecutionContext } from './context';
export { resource, contextOf } from './resource';

import { ExecutionContext } from './context';

export function main(operation) {
  let top = new ExecutionContext();
  top.enter(operation);
  return top;
}
