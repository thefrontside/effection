import { Operation, resource } from 'effection';
import { once, throwOnErrorEvent } from '@effection/events';

const execa = require('execa');
import { Options, NodeOptions, ExecaChildProcess, ExecaReturnValue } from 'execa';

function *supervise(child: ExecaChildProcess, command: string, args: readonly string[] = []) {
  try {
    yield throwOnErrorEvent(child);

    let {exitCode: code}: {exitCode: number} = yield once(child, "exit");
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

// buffer will wait to resolve the promise until stdio is read, which works well for generators in effection
// shell and detached will cover random piping errors, and windowsHide:true is the default
// preferLocal runs node scripts local first
const EXECA_DEFAULTS = {shell: process.env.shell || true, detached: true, preferLocal: true, buffer: false, stdio: 'inherit'}

export function *spawn(command: string, args?: ReadonlyArray<string>, options?: Options): Operation {
  // execa provides sugar on top of child_process.spawn
  let child = execa(command, args || [], Object.assign({}, options, EXECA_DEFAULTS))
  return yield resource(child, supervise(child, command, args));
}

export function *fork(module: string, args?: ReadonlyArray<string>, options?: NodeOptions): Operation {
  // execa.node creates a nodejs process, sugar on top of child_process.fork
  let child = execa.node(module, args, Object.assign({}, options, EXECA_DEFAULTS))
  return yield resource(child, supervise(child, module, args));
}

export function spawnUnsupervised(command: string, args?: ReadonlyArray<string>, options?: Options): ExecaChildProcess {
  return execa(command, args || [], Object.assign({}, options, EXECA_DEFAULTS, {buffer: true}))
}

export function forkUnsupervised(command: string, args?: ReadonlyArray<string>, options?: Options): ExecaChildProcess {
  return execa.node(command, args, Object.assign({}, options, EXECA_DEFAULTS, {buffer: true}))
}

export {ExecaChildProcess as ChildProcess, ExecaReturnValue as ChildProcessReturn}
