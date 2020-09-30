import { Operation, resource, spawn } from 'effection';
import { Channel } from '@effection/channel';
import { subscribe } from '@effection/subscription';

import { exec, Process, ExecOptions, StdIO, ExitStatus, stringifyExitStatus  } from '.';

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */

export function* daemon(command: string, options: ExecOptions = {}): Operation<StdIO> {
  let stdin = new Channel<string>();
  let stdout = new Channel<string>();
  let stderr = new Channel<string>();

  return yield resource({ stdin, stdout, stderr }, function*() {
    let process: Process = yield exec(command, options);

    yield spawn(subscribe(process.stdout).forEach(function*(chunk) {
      stdout.send(chunk);
    }));

    yield spawn(subscribe(process.stderr).forEach(function*(chunk) {
      stderr.send(chunk);
    }));

    yield spawn(subscribe(stdin).forEach(function*(chunk) {
      process.stdin.send(chunk);
    }));

    let status: ExitStatus = yield process.join();

    let error = new Error(`daemon process quit unexpectedly\n${stringifyExitStatus(status)}`);

    error.name = 'DaemonExitError';

    throw error;
  });
}
