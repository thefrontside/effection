/* eslint no-console: 0 */
/* eslint require-yield: 0 */
import { execute, timeout } from '../src/index';


/**
 * Fires up some random servers
 */
execute(interruptable(function*() {
  this.fork(randoLogger('Bob'));
  this.fork(randoLogger('Alice'));

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


function interruptable(proc) {
  return function*() {
    let interrupt = () => console.log('') || this.halt();
    process.on('SIGINT', interrupt);
    try {
      yield proc;
    } finally {
      process.off('SIGINT', interrupt);
    }
  };
}
