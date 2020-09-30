import { Operation, resource, spawn } from 'effection';
import { Channel } from '@effection/channel';
import { on, once } from '@effection/events';
import { spawn as spawnProcess } from 'child_process';
import { subscribe } from '@effection/subscription';
import { Buffer } from './buffer';
import { ExitStatus, CreateOSProcess, stringifyExitStatus } from './api';

export const createPosixProcess: CreateOSProcess = function* (command, options) {
  let childProcess = spawnProcess(command, options.arguments || [], {
    detached: true,
    shell: options.shell == null ? true : options.shell,
    env: options.env,
    cwd: options.cwd
  });

  let stdin = new Channel<string>();
  let stdout = new Channel<string>();
  let stderr = new Channel<string>();
  let exit = new Buffer<[number?, string?]>();
  let errors: unknown[] = [];
  let tail: string[] = [];

  function addToTail(chunk: string) {
    if (tail.length < 100) {
      tail.push(chunk);
    }
  }

  function* join(): Operation<ExitStatus> {
    let [code, signal]: [number?, string?] = yield subscribe(exit).expect();
    return { command, options, code, signal, errors, tail };
  }

  function* expect(): Operation<ExitStatus> {
    let status: ExitStatus = yield join();
    if (status.code != 0) {
      let error = new Error(stringifyExitStatus(status))
      error.name = `ExecError`;
      throw error;
    } else {
      return status;
    }
  }

  return yield resource({ stdin, stdout, stderr, join, expect }, function*() {
    try {
      yield spawn(on(childProcess, 'error').forEach(function*([error]) {
        errors.push(error);
      }));

      yield spawn(on<[string]>(childProcess.stdout, 'data').forEach(function*([data]) {
        addToTail(data);
        stdout.send(data);
      }));

      yield spawn(on<[string]>(childProcess.stderr, 'data').forEach(function*([data]) {
        addToTail(data);
        stdout.send(data);
      }));

      yield spawn(subscribe(stdin).forEach(function*(data) {
        childProcess.stdin.write(data);
      }))

      let status = yield once(childProcess, 'exit')
      exit.send(status)
    } finally {
      try {
        process.kill(-childProcess.pid, "SIGTERM")
      } catch(e) {
        // do nothing, process is probably already dead
      }
    }
  });
}
