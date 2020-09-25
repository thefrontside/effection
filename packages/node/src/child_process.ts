import { Operation, resource } from "effection";
import { once, throwOnErrorEvent } from "@effection/events";

import * as npmRunPath from "npm-run-path";
import * as TreeKill from "tree-kill";
const treeKill: any = TreeKill;
import * as childProcessCross from "cross-spawn";
import * as childProcess from "child_process";
import { SpawnOptions, ForkOptions, ChildProcess } from "child_process";

export { ChildProcess } from "child_process";

function* supervise(
  child: ChildProcess,
  command: string,
  args: readonly string[] = []
) {
  let forceKillSignal: string = "SIGKILL"
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
    let [code, signal]: [number, any] = yield once(child, "exit");
    if (typeof signal === "string") forceKillSignal = signal
    if (code !== 0) {
      throw new Error(
        `'${(command + args.join(" ")).trim()}' exited with non-zero exit code`
      );
    }
  } finally {
    try {
      if (process.platform === 'win32') {
        // @ts-ignore
        child?.stdout?.end();
        // @ts-ignore
        child?.stderr?.end();
        treeKill(child.pid, forceKillSignal, (err: any) => {/*no-op*/});
      } else {
        process.kill(-child.pid, "SIGTERM")
      }
    } catch(e) {
      // do nothing, process is probably already dead
    }
  }
}

// using the shell that invokes will also hide the window on windows
const withDefaults = (options: SpawnOptions | undefined): SpawnOptions => {
  return {
    // when windows shell is true, it runs with cmd.exe by default
    // node has trouble with PATHEXT and exe
    // `cross-spawn` handles running it with the shell in windows if needed
    ...(process.platform === "win32" ? {} : { shell: true }),
    stdio: "pipe",
    // we lose exit information and events if this is
    // detached in windows
    detached: process.platform === "win32" ? false : true,
    cwd: options?.cwd || process.cwd(),
    // if we use true than it opens a window in windows+powershell
    // mac and linux don't need it either
    env: npmRunPath.env({
      env: Object.assign({}, process.env, options?.env),
      cwd: options?.cwd || process.cwd(),
      execPath: process.execPath,
    }),
  };
};

const c = (command: string) => {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "yarn") {
    return `${command}.cmd`;
  } else {
    return command;
  }
};

export function* spawn(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions
): Operation {
  let child = childProcessCross.spawn(
    c(command),
    args || [],
    withDefaults(options)
  );
  child?.stdin?.end();
  return yield resource(child, supervise(child, command, args));
}

export function spawnProcess(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions
): ChildProcess {
  const spawned = childProcessCross.spawn(
    c(command),
    args || [],
    withDefaults(options)
  );
  spawned?.stdin?.end();

  spawned.once("exit", (code, signal) => {
    const safeSignal = signal === null ? 'SIGTERM' : signal;
    try {
      if (process.platform === 'win32') {
        // @ts-ignore
        spawned?.stdout?.end();
        // @ts-ignore
        spawned?.stderr?.end();
        treeKill(spawned.pid, safeSignal, (err: any) => {/*no-op*/});
      } else {
        process.kill(-spawned.pid, safeSignal)
      }
    } catch(e) {
      // do nothing, process is probably already dead
    }
  });

  return spawned;
}

export function* fork(
  module: string,
  args?: ReadonlyArray<string>,
  options?: ForkOptions
): Operation {
  let child = childProcess.fork(module, args, withDefaults(options));
  child?.stdin?.end();
  return yield resource(child, supervise(child, module, args));
}
