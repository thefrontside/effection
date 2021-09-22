import { spawn, Task, createFuture, withLabels } from '@effection/core';
import { on, once, onceEmit } from '@effection/events';
import { spawn as spawnProcess } from 'child_process';
import { Writable, ExitStatus, CreateOSProcess } from './api';
import { ExecError } from './error';
import { createOutputStream } from '../output-stream';

type Result = { type: 'error'; value: unknown } | { type: 'status'; value: [number?, string?] };

export const createPosixProcess: CreateOSProcess = (command, options) => {
  return {
    *init(scope: Task) {
      let { future, produce } = createFuture<Result>();

      let join = () => withLabels(function*() {
        let result: Result = yield withLabels(future, { name: 'awaitResult' });
        if (result.type === 'status') {
          let [code, signal] = result.value;
          return { command, options, code, signal } as ExitStatus;
        } else {
          throw result.value;
        }
      }, { name: 'joinProcess', expand: false });

      let expect = () => withLabels(function*() {
        let status: ExitStatus = yield join();
        if (status.code != 0) {
          throw new ExecError(status, command, options);
        } else {
          return status;
        }
      }, { name: 'expectProcess', expand: false });
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
      scope.setLabels({ state: 'running', pid: childProcess.pid || '' });

      let { pid } = childProcess;

      let stdout = createOutputStream(function*(publish) {
        yield spawn(on<Buffer>(childProcess.stdout, 'data').forEach(publish));
        yield future;
        return undefined;
      }, 'stdout');

      let stderr = createOutputStream(function*(publish) {
        yield spawn(on<Buffer>(childProcess.stderr, 'data').forEach(publish));
        yield future;
        return undefined;
      }, 'stderr');

      let stdin: Writable<string> = {
        send(data: string) {
          childProcess.stdin.write(data);
        }
      };

      yield spawn(function* execProcess() {
        yield spawn(function* trapError() {
          let value: Error = yield once(childProcess, 'error');
          produce({ state: 'completed', value: { type: 'error', value } });
          scope.setLabels({ state: 'errored' });
        });

        try {
          let value = yield onceEmit(childProcess, 'exit');
          produce({ state: 'completed', value: { type: 'status', value } });
          scope.setLabels({ state: 'terminated', exitCode: value[0], signal: value[1] });
        } finally {
          try {
            if(typeof childProcess.pid === 'undefined') {
              throw new Error('no pid for childProcess');
            }
            process.kill(-childProcess.pid, "SIGTERM");
          } catch(e) {
            // do nothing, process is probably already dead
          }
        }
      });

      return { pid: pid as number, stdin, stdout, stderr, join, expect };
    }
  };
};
