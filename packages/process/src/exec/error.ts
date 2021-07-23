import { ExitStatus, ExecOptions } from './api';

export class ExecError extends Error {
  constructor(public status: ExitStatus, public command: string, public options: ExecOptions) {
    super();
  }

  name = "ExecError";

  get message(): string {
    let code = this.status.code ? `code: ${this.status.code}`: null;

    let signal = this.status.signal ? `signal: ${this.status.signal}` : null;

    let env = `env: ${JSON.stringify(this.options.env || {})}`;

    let shell = this.options.shell ? `shell: ${this.options.shell}` : null;

    let cwd = this.options.cwd ? `cwd: ${this.options.cwd}` : null;

    let command = `$ ${this.command} ${this.options.arguments?.join(" ")}`.trim();

    return [code, signal, env, shell, cwd, command].filter(item => !!item).join("\n");
  }
}

export class DaemonExitError extends ExecError {
  name = "DaemonExitError";

  get message(): string {
    return `daemon process quit unexpectedly\n${super.message}`;
  }
}
