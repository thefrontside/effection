/// <reference types="../types/shellwords" />
import { split } from 'shellwords';

import { Task, Operation, Resource, withLabels } from '@effection/core';
import { ExecOptions, Process, ProcessResult, CreateOSProcess } from './exec/api';
import { createPosixProcess } from './exec/posix';
import { createWin32Process, isWin32 } from './exec/win32';

export * from './exec/api';
export * from './exec/error';

export interface Exec extends Resource<Process> {
  join(): Operation<ProcessResult>;
  expect(): Operation<ProcessResult>;
}

const createProcess: CreateOSProcess = (cmd, opts) => {
  if (isWin32()) {
    return createWin32Process(cmd, opts);
  } else {
    return createPosixProcess(cmd, opts);
  }
};

/**
 * Execute `command` with `options`. You should use this operation for processes
 * that have a finite lifetime and on which you may wish to synchronize on the
 * exit status. If you want to start a process like a server that spins up and runs
 * forever, consider using `daemon()`
 */
export function exec(command: string, options: ExecOptions = {}): Exec {
  let [cmd, ...args] = options.shell ? [command]: split(command);
  let opts = { ...options, arguments: args.concat(options.arguments || []) };

  return {
    name: `exec \`${cmd} ${args.join(' ')}\``,
    labels: {
      expand: false
    },
    init(scope: Task, local: Task) {
      return createProcess(cmd, opts).init(scope, local);
    },
    join() {
      return withLabels(function*() {
        let process = yield createProcess(cmd, { ...opts, buffered: true });

        let status = yield process.join();
        let stdout = yield process.stdout.expect();
        let stderr = yield process.stderr.expect();

        return { ...status, stdout, stderr };
      }, { name: `exec join \`${cmd} ${args.join(' ')}\``, expand: false });
    },
    expect() {
      return withLabels(function*() {
        let process = yield createProcess(cmd, { ...opts, buffered: true });

        let status = yield process.expect();
        let stdout = yield process.stdout.expect();
        let stderr = yield process.stderr.expect();

        return { ...status, stdout, stderr };
      }, { name: `exec expect \`${cmd} ${args.join(' ')}\``, expand: false });
    }
  };
}
