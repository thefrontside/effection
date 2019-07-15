/* eslint no-console: 0 */
import { execute, timeout } from '../src/index';


/**
 * A simple script that counts down from 5 to 1, pausing for one
 * second in between each count.
 *
 * It can be interrupted at any point by sending SIGINT to the process
 * (usually bound to CTRL-C in the console). It's worth noting though
 * that unlike most `SIGINT`' handlers you see in nodejs, this one
 * does _not_ call `process.exit()`.
 *
 * Instead, it just halts the current execution which stops the
 * countdown, but also exits the
 * interruptable context which uninstalls the `SIGINT` handler.
 * The node process then exits not because we called `exit()`, but
 * because there is nothing more to execute, and no more event
 * handlers installed.
 *
 * The same thing happens in the case of when you *do not* cancel the
 * countdown prematurely. It finishes normally, the countdown scope
 * exits, then the interruptable scope exits, and so the `SIGINT`
 * handler is uninstalled. Once again, the node process is left with
 * nothing left to do and no event handlers, so it exits.
 */
execute(interruptable(function*() {
  for (let i = 5; i > 0; i--) {
    console.log(`${i}...`);
    yield timeout(1000);
  }
  console.log('liftoff!');
}));


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
