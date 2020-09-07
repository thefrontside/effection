import { Operation, resource } from 'effection';

import * as ExecaProcess from 'execa'
const execa = require('execa');

// buffer will wait to resolve the promise until stdio is read, which works well for generators in effection
// shell and detached will cover random piping errors, and windowsHide:true is the default
// preferLocal runs node scripts local first
const EXECA_DEFAULTS = {shell: process.env.shell || true, detached: true, preferLocal: true, buffer: false, stdio: 'inherit'}

export function *spawn(command: string, args?: ReadonlyArray<string>, options?: ExecaProcess.Options): Operation<ExecaProcess.ExecaReturnValue> {
  // execa provides sugar on top of child_process.spawn
  let child = execa(command, args || [], Object.assign({}, options, EXECA_DEFAULTS))
  return yield resource(child, function*() {
    try {
      yield child;
    } finally {
      child.cancel();
    }
  });
}

export function *fork(module: string, args?: ReadonlyArray<string>, options?: ExecaProcess.NodeOptions): Operation<ExecaProcess.ExecaReturnValue> {
  // execa.node creates a nodejs process, sugar on top of child_process.fork
  let child = execa.node(module, args, Object.assign({}, options, EXECA_DEFAULTS))
  return yield resource(child, function*() {
    try {
      yield child;
    } finally {
      child.cancel();
    }
  });
}

// export function *spawnUnsupervised(command: string, args?: ReadonlyArray<string>, options?: execa.Options): Generator<execa.ExecaReturnValue> {
//   return yield execa(command, args || [], Object.assign({}, options, EXECA_DEFAULTS, {buffer: true}))
// }

// export function *forkUnsupervised(command: string, args?: ReadonlyArray<string>, options?: execa.Options): Generator<execa.ExecaReturnValue> {
//   return yield execa.node(command, args, Object.assign({}, options, EXECA_DEFAULTS, {buffer: true}))
// }

export { ExecaProcess }
