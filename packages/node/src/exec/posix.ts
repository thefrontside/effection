import { Operation, resource, spawn } from '@effection/core';
import { Channel } from '@effection/channel';
import { on, once } from '@effection/events';
import { spawn as spawnProcess } from 'child_process';
import { subscribe } from '@effection/subscription';
import { ExitStatus, CreateOSProcess, stringifyExitStatus } from './api';
import { Deferred } from './deferred';

type Result = { type: 'error'; value: unknown } | { type: 'status'; value: [number?, string?] };

export const createPosixProcess: CreateOSProcess = function* (command, options) {
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
  // Killing all child processes started by this command is surprisingly
  // tricky. If a process spawns another processes and we kill the parent,
  // then the child process is NOT automatically killed. Instead we're using
  // the `detached` option to force the child into its own process group,
  // which all of its children in turn will inherit. By sending the signal to
  // `-pid` rather than `pid`, we are sending it to the entire process group
  // instead. This will send the signal to all processes started by the child
  // process.
  //
  // More information here: https://unix.stackexchange.com/questions/14815/process-descendants
  let childProcess = spawnProcess(command, options.arguments || [], {
    detached: true,
    shell: options.shell,
    env: options.env,
    cwd: options.cwd
  });

  let { pid } = childProcess;

  return yield resource({ pid, stdin, stdout, stderr, join, expect }, function*() {


    let onError = (value: unknown) => getResult.resolve({ type: 'error', value });

    try {
      childProcess.on('error', onError);

      yield spawn(on<[string]>(childProcess.stdout, 'data').forEach(function*([data]) {
        addToTail(data);
        stdout.send(data);
      }));

      yield spawn(on<[string]>(childProcess.stderr, 'data').forEach(function*([data]) {
        addToTail(data);
        stderr.send(data);
      }));

      yield spawn(subscribe(stdin).forEach(function*(data) {
        childProcess.stdin.write(data);
      }))

      let value = yield once(childProcess, 'exit')
      getResult.resolve({ type: 'status', value });

    } finally {
      stdout.close();
      stderr.close();
      childProcess.off('error', onError);
      try {
        process.kill(-childProcess.pid, "SIGTERM")
      } catch(e) {
        // do nothing, process is probably already dead
      }
    }
  });
}
