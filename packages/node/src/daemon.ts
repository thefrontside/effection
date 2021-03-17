import { Task } from '@effection/core';

import { exec, Process, ExecOptions, ExitStatus, DaemonExitError } from './exec';

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */

export interface Daemon {
  run(scope: Task): Process;
}

export function daemon(command: string, options: ExecOptions = {}): Daemon {
  return {
    run(scope) {
      let process = exec(command, options).run(scope);

      scope.spawn(function*() {
        let status: ExitStatus = yield process.join();
        throw new DaemonExitError(status, command, options);
      });

      return process;
    }
  }
}
