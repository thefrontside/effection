import { ctrlc } from 'ctrlc-windows';
import { Process } from '@effection/process';

const isWin32 = global.process.platform === 'win32';

export function terminate(process: Process) {
  if (isWin32) {
    ctrlc(process.pid);
    //Terminate batch process? (Y/N)
    process.stdin.write("Y\n");
  } else {
    global.process.kill(process.pid, 'SIGTERM');
  }
}

// cross platform user initiated graceful shutdown request. What would
// be sent to the process by the Operating system when
// a users requests an interrupt via CTRL-C or equivalent.
export function interrupt(process: Process) {
  if (isWin32) {
    ctrlc(process.pid);
    //Terminate batch process? (Y/N)
    process.stdin.write("Y\n");
  } else {
    global.process.kill(process.pid, 'SIGINT');
  }
}
