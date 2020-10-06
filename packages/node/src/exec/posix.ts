import { Operation, resource, spawn } from 'effection';
import { Channel } from '@effection/channel';
import { on, once } from '@effection/events';
import { spawn as spawnProcess } from 'child_process';
import { subscribe } from '@effection/subscription';
import { ExitStatus, CreateOSProcess, stringifyExitStatus } from './api';
import { Deferred } from './deferred';

type Result = { type: 'error', value: unknown } | { type: 'status', value: [number?, string?] };

export const createPosixProcess: CreateOSProcess = function* (command, options) {
  let childProcess = spawnProcess(command, options.arguments || [], {
    detached: true,
    shell: options.shell,
    env: options.env,
    cwd: options.cwd
  });

  let stdin = new Channel<string>();
  let stdout = new Channel<string>();
  let stderr = new Channel<string>();
  let tail: string[] = [];

  let getResult = Deferred<Result>();

  function addToTail(chunk: string) {
    if (tail.length < 100) {
      tail.push(chunk);
    }
  }

  function* join(): Operation<ExitStatus> {
    let result: Result = yield getResult.promise;
    if (result.type === 'status') {
      let [code, signal] = result.value;
      return { command, options, code, signal, tail };
    } else {
      throw result.value;
    }
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
    let onError = (value: unknown) => getResult.resolve({ type: 'error', value });
    try {
      childProcess.on('error', onError);

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

      let value = yield once(childProcess, 'exit')
      getResult.resolve({ type: 'status', value });
    } finally {
      try {
        stdout.close();
        stderr.close();
        childProcess.off('error', onError);
        process.kill(-childProcess.pid, "SIGTERM")
      } catch(e) {
        // do nothing, process is probably already dead
      }
    }
  });
}
