export { timeout } from './timeout';
export { fork, join, spawn, spawn as monitor } from './control';

export { ExecutionContext } from './context';
export { resource, contextOf } from './resource';

import { ExecutionContext } from './context';

export function run(operation) {
  let top = new ExecutionContext({ blockOnReturnedContext: true });
  top.enter(operation);
  return top;
}

export function main(operation) {
  console.warn("Effection `main` is deprecated, please use `run` instead");
  return run(operation);
}
