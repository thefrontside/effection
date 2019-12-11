/* eslint no-console: 0 */
import { enter, fork, timeout } from '../src/index';

import { interruptable } from './inerruptable';

/**
 * Fires up some random servers
 */
enter(interruptable(function*() {
  yield fork(randoLogger('Bob'));
  yield fork(randoLogger('Alice'));

  console.log('Up and running with random number servers Bob and Alice....');
}));


/**
 * Create a process that puts something to the console at random
 * intervals.
 */
function randoLogger(name) {
  return function*() {
    console.log(`Starting Rando Server ${name}`);
    try {
      while (true) {
        let ms = Math.floor(Math.random() * 5000);
        yield timeout(ms);
        console.log(`${name} slept for ${ms}ms`);
      }
    } finally {
      console.log(`${name} is shutting down`);
    }
  };
}
