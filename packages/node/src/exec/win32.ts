import { platform } from "os";
import { Operation, resource, spawn } from "effection";
import { Channel } from "@effection/channel";
import { on, once } from "@effection/events";
import { spawn as spawnProcess } from "cross-spawn";
import { subscribe } from "@effection/subscription";
import { ctrlc } from "ctrlc-windows";
import { ExitStatus, CreateOSProcess, stringifyExitStatus } from "./api";
import { Deferred } from "./deferred";

type Result =
  | { type: "error"; value: unknown }
  | { type: "status"; value: [number?, string?] };

export const createWin32Process: CreateOSProcess = function*(command, options) {
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
    if (result.type === "status") {
      let [code, signal] = result.value;
      return { command, options, code, signal, tail };
    } else {
      throw result.value;
    }
  }

  function* expect(): Operation<ExitStatus> {
    let status: ExitStatus = yield join();
    if (status.code != 0) {
      let error = new Error(stringifyExitStatus(status));
      error.name = `ExecError`;
      throw error;
    } else {
      return status;
    }
  }

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

  return yield resource(
    { pid, stdin, stdout, stderr, join, expect },
    function*() {
      let onError = (value: unknown) =>
        getResult.resolve({ type: "error", value });

      try {
        childProcess.on("error", onError);

        yield spawn(
          on<[string]>(childProcess.stdout, "data").forEach(function*([data]) {
            addToTail(data);
            stdout.send(data);
          })
        );

        yield spawn(
          on<[string]>(childProcess.stderr, "data").forEach(function*([data]) {
            addToTail(data);
            stderr.send(data);
          })
        );

        yield spawn(
          subscribe(stdin).forEach(function*(data) {
            childProcess.stdin.write(data);
          })
        );

        let value = yield once(childProcess, "exit");
        getResult.resolve({ type: "status", value });
      } finally {
        stdout.close();
        stderr.close();
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
    }
  );
};

export const isWin32 = () => platform() === "win32";
