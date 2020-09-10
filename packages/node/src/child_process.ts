import { Operation, resource } from "effection";
import { once, throwOnErrorEvent } from "@effection/events";

import * as childProcessCross from "cross-spawn";
import * as childProcess from "child_process";
import { SpawnOptions, ForkOptions, ChildProcess } from "child_process";

export { ChildProcess } from "child_process";

function* supervise(
  child: ChildProcess,
  command: string,
  args: readonly string[] = []
) {
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
  try {
    yield throwOnErrorEvent(child);

    let [code]: [number] = yield once(child, "exit");
    if (code !== 0) {
      throw new Error(
        `'${(command + args.join(" ")).trim()}' exited with non-zero exit code`
      );
    }
  } finally {
    try {
      process.kill(-child.pid, "SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    } catch (e) {
      // do nothing, process is probably already dead
    }
  }
}

// using the shell that invokes will also hide the window on windows
const PROCESS_DEFAULTS: SpawnOptions = {
  shell: process.env.shell || true,
  timeout: 25 * 60 * 1000,
};

export function* spawn(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions
): Operation {
  let child = childProcessCross.spawn(
    command,
    args || [],
    Object.assign({stdio: "ignore"}, options, PROCESS_DEFAULTS)
  );
  return yield resource(child, supervise(child, command, args));
}

export function spawnProcess(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions | any
): ChildProcess {
  const spawned = childProcessCross.spawn(
    command,
    args || [],
    Object.assign({stdio: "ignore"}, options, PROCESS_DEFAULTS)
  );
  spawned.once("SIGINT", () => forceShutDown(spawned, "SIGINT", 3000));
  spawned.once("SIGTERM", () => forceShutDown(spawned, "SIGTERM", 3000));
  process.once("SIGTERM", () =>
    forceShutDown(spawned, "process SIGTERM", 3000)
  );
  process.once("SIGINT", () =>
    forceShutDown(spawned, "process SIGINT", 3000)
  );
  return spawned;
}

export function* fork(
  module: string,
  args?: ReadonlyArray<string>,
  options?: ForkOptions
): Operation {
  let child = childProcess.fork(
    module,
    args,
    Object.assign({stdio: "ignore"}, options, PROCESS_DEFAULTS)
  );
  return yield resource(child, supervise(child, module, args));
}

function forceShutDown(child: ChildProcess, from: string, timeout: number) {
  setTimeout(() => {
    console.error(
      `forcing process shutdown of ${child.pid} initiated from ${from}\n`,
      child
    );
    if (process.platform === "win32") {
      childProcessCross.spawn(
        "taskkill",
        ["/pid", `${child.pid}`, "/f", "/t"],
        PROCESS_DEFAULTS
      );
    } else {
      child.kill("SIGKILL");
    }
  }, timeout);
}
