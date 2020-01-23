export { timeout } from './timeout';
export { fork, join, monitor } from './control';
export { any } from './pattern';
export { send, receive } from './mailbox';

import { ExecutionContext } from './context';

export function main(operation) {
  let top = new ExecutionContext();
  top.enter(operation);
  return top;
}
