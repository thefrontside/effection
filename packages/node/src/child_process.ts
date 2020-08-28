import { Operation, resource } from 'effection';
import { once, throwOnErrorEvent } from '@effection/events';

const execa = require('execa');
import { Options, NodeOptions, ExecaChildProcess } from 'execa';

function *supervise(child: ExecaChildProcess, command: string, args: readonly string[] = []) {
  try {
    yield throwOnErrorEvent(child);

    let [code]: [number] = yield once(child, "exit");
    if(code !== 0) {
      throw new Error(`'${(command + args.join(' ')).trim()}' exited with non-zero exit code`);
    }
  } finally {
    try {
      // https://github.com/sindresorhus/execa#killsignal-options
      // Same as the original child_process#kill() except: if signal is SIGTERM (the default value)
      // and the child process is not terminated after 5 seconds, force it by sending SIGKILL.
      child.kill("SIGTERM")
    } catch(e) {
      // do nothing, process is probably already dead
    }
  }
}

export function *spawn(command: string, args?: ReadonlyArray<string>, options?: Options): Operation {
  // execa provides sugar on top of child_process.spawn
  let child = execa(command, args || [], options);
  return yield resource(child, supervise(child, command, args));
}

export function *fork(module: string, args?: ReadonlyArray<string>, options?: NodeOptions): Operation {
  // execa.node creates a nodejs process, sugar on top of child_process.fork
  let child = execa.node(module, args, options);
  return yield resource(child, supervise(child, module, args));
}

export {ExecaChildProcess as ChildProcess}
