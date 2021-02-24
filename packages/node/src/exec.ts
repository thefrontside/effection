/// <reference types="../types/shellwords" />
import { split } from 'shellwords';

import { Operation } from '@effection/core';
import { ExecOptions, Process, } from './exec/api';
import { createPosixProcess } from './exec/posix';
import { createWin32Process, isWin32 } from './exec/win32';

export * from './exec/api';

/**
 * Execute `command` with `options`. You should use this operation for processes
 * that have a finite lifetime and on which you may wish to synchronize on the
 * exit status. If you want to start a process like a server that spins up and runs
 * forever, consider using `daemon()`
 */
export function exec(command: string, options: ExecOptions = {}): Operation<Process> {
  let [cmd, ...args] = split(command);
  let opts = { ...options, arguments: args.concat(options.arguments || []) }

  if (isWin32()) {
    return createWin32Process(cmd, opts);
  } else {
    return createPosixProcess(cmd, opts);
  }
}
