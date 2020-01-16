/* eslint no-console: 0 */

import { fork, join } from '../src/index';

export function interruptable(operation) {
  return function*() {
    let child = yield fork(operation);
    let interrupt = () => console.log('') || child.halt();
    process.on('SIGINT', interrupt);
    try {
      yield join(child);
    } finally {
      process.off('SIGINT', interrupt);
    }
  };
}
