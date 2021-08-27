import { spawn, Resource } from '@effection/core';

import { exec, Process, ExecOptions, ExitStatus, DaemonExitError } from './exec';

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Daemon extends Resource<Process> {}

export function daemon(command: string, options: ExecOptions = {}): Daemon {
  return {
    name: `daemon \`${command}\``,
    labels: {
      expand: false,
    },
    *init() {
      let process = yield exec(command, options);

      yield spawn(function* failOnExit() {
        let status: ExitStatus = yield process.join();
        throw new DaemonExitError(status, command, options);
      });

      return process;
    }
  };
}
