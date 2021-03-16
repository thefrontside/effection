import { Task } from '@effection/core';

import { exec, Process, ExecOptions, StdIO, ExitStatus, DaemonExitError } from './exec';

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */

export function daemon(scope: Task, command: string, options: ExecOptions = {}): StdIO {
  let process: Process = exec(scope, command, options);

  scope.spawn(function*() {
    let status: ExitStatus = yield process.join();

    throw new DaemonExitError(status, command, options);
  });

  return process;
}
