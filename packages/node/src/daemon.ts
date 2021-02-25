import { Operation, Task } from '@effection/core';
import { Channel } from '@effection/channel';
import { subscribe } from '@effection/subscription';

import { exec, Process, ExecOptions, StdIO, ExitStatus, stringifyExitStatus  } from './exec';

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */

export function daemon(scope: Task, command: string, options: ExecOptions = {}): StdIO {
  let stdin = new Channel<string>();
  let stdout = new Channel<string>();
  let stderr = new Channel<string>();

  scope.spawn(function*(task) {
    let process: Process = exec(task, command, options);

    task.spawn(subscribe(task, process.stdout).forEach((chunk) => function*() {
      stdout.send(chunk);
    }));

    task.spawn(subscribe(task, process.stderr).forEach((chunk) => function*() {
      stderr.send(chunk);
    }));

    task.spawn(subscribe(task, stdin).forEach((chunk) => function*() {
      process.stdin.send(chunk);
    }));

    let status: ExitStatus = yield process.join();

    let error = new Error(`daemon process quit unexpectedly\n${stringifyExitStatus(status)}`);

    error.name = 'DaemonExitError';

    throw error;
  });

  return { stdin, stdout, stderr };
}
