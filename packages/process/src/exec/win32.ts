import { platform } from "os";
import { spawn, Task, Operation, createFuture } from '@effection/core';
import { on, once, onceEmit } from "@effection/events";
import { spawn as spawnProcess } from "cross-spawn";
import { ctrlc } from "ctrlc-windows";
import { ExitStatus, CreateOSProcess, Writable } from "./api";
import { ExecError } from "./error";
import { createOutputStream } from '../output-stream';

type Result =
  | { type: "error"; value: unknown }
  | { type: "status"; value: [number?, string?] };

export const createWin32Process: CreateOSProcess = (command, options) => {
  return {
    *init(scope: Task) {
      let { future, produce } = createFuture<Result>();

      let join = (): Operation<ExitStatus> => function*() {
        let result: Result = yield future;
        if (result.type === "status") {
          let [code, signal] = result.value;
          return { command, options, code, signal };
        } else {
          throw result.value;
        }
      };

      let expect = (): Operation<ExitStatus> => function*() {
        let status: ExitStatus = yield join();
        if (status.code != 0) {
          throw new ExecError(status, command, options);
        } else {
          return status;
        }
      };

      let childProcess = spawnProcess(command, options.arguments || [], {
        // We lose exit information and events if this is detached in windows
        // and it opens a window in windows+powershell.
        detached: false,
        // When windows shell is true, it runs with cmd.exe by default, but
        // node has trouble with PATHEXT and exe. It can't run exe directly for example.
        // `cross-spawn` handles running it with the shell in windows if needed.
        // Neither mac nor linux need shell and we run it detached.
        shell: false,
        // With stdio as pipe, windows gets stuck where neither the child nor the
        // parent wants to close the stream, so we call it ourselves in the exit event.
        stdio: "pipe",
        // Hide the child window so that killing it will not block the parent
        // with a Terminate Batch Process (Y/n)
        windowsHide: true,

        env: options.env,
        cwd: options.cwd,
      });

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

      let stdin: Writable = {
        *write(data) {
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
          if (pid) {
            ctrlc(pid);
            let stdin = childProcess.stdin;
            if (stdin.writable) {
              try {
                //Terminate batch process (Y/N)
                stdin.write("Y\n");
              } catch (_err) { /* not much we can do here */}
            }
            stdin.end();
          }
        }
      });

      return { pid: pid as number, stdin, stdout, stderr, join, expect };
    }
  };
};

export const isWin32 = (): boolean => platform() === "win32";
