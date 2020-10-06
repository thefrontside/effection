import { Operation } from 'effection';
import { Channel } from '@effection/channel';

/**
 * The process type is what is returned by the `exec` operation. It has all of
 * standard io handles, and methods for synchronizing on return.
 */
export interface Process extends StdIO {
  /**
   * Completes once the process has finished regardless of whether it was
   * successful or not.
   */
  join(): Operation<ExitStatus>;

  /**
   * Completes once the process has finished successfully. If the process does
   * not complete successfully, it will raise an ExecError.
   */
  expect(): Operation<ExitStatus>;
}

export interface ExecOptions {
  /**
   * When not using passing the `shell` option all arguments must be passed
   * as an array.
   */
  arguments?: string[];

  /**
   * Map of environment variables to use for the process.
   */
  env?: Record<string, string>;

  /**
   * Create an intermediate shell process. Useful if you need to handle glob
   * expantion;
   */
  shell?: boolean;

  /**
   * Sets the working directory of the process
   */
  cwd?: string;
}

export interface StdIO {
  stdout: Channel<string>;
  stderr: Channel<string>;
  stdin: Channel<string>;
}

export interface ExitStatus {
  /**
   * exit code
   * //TODO: is this pertinent on Windows? Do we need an 'OK' flag
   */
  code?: number;

  /**
   * If the process exited with a signal instead of an exit code, it
   * is recorded here.
   */
  signal?: string;

  /**
   * A buffer of the recent output from both `stdout` and `stderr` that can
   * be helpful for debugging
   */
  tail: string[];

  /**
   * The original command used to create the process
   */
  command: string;

  /**
   * The original options used to create the process.
   */
  options: ExecOptions;
}


export interface CreateOSProcess {
  (command: string, options: ExecOptions): Operation<Process>;
}


export function stringifyExitStatus(status: ExitStatus) {
  let { options } = status;

  let code = status.code ? `code: ${status.code}`: null;

  let signal = status.signal ? `signal: ${status.signal}` : null;

  let env = `env: ${JSON.stringify(options.env || {})}`;

  let shell = options.shell ? `shell: ${options.shell}` : null;

  let cwd = options.cwd ? `cwd: ${options.cwd}` : null;

  let command = `$ ${status.command} ${options.arguments}`.trim()

  let tail = status.tail.join("");

  return [code, signal, env, shell, cwd, command, tail].filter(item => !!item).join("\n");
}
