import { Operation, resource } from 'effection';
import { once, throwOnErrorEvent } from '@effection/events';

import * as childProcess from 'child_process';
import { SpawnOptions, ForkOptions, ChildProcess } from 'child_process';

export { ChildProcess } from 'child_process';

function *supervise(child: ChildProcess) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    if(code !== 0) {
      throw new Error("child exited with non-zero exit code")
    }
  } finally {
    try {
      process.kill(-child.pid, "SIGTERM")
    } catch(e) {
      // do nothing, process is probably already dead
    }
  }
}

export function *spawn(command: string, args?: ReadonlyArray<string>, options?: SpawnOptions): Operation {
  let child = childProcess.spawn(command, args, Object.assign({}, options, {
    shell: true,
    detached: true,
  }));
  return yield resource(child, supervise(child));
}

export function *fork(module: string, args?: ReadonlyArray<string>, options?: ForkOptions): Operation {
  let child = childProcess.fork(module, args, Object.assign({}, options, {
    detached: true,
  }));
  return yield resource(child, supervise(child));
}
