import { Operation, Resource } from '@effection/core';
import { OutputStream } from '../output-stream';

export interface Writable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  write(message: any): Operation<void>;
}

/**
 * The process type is what is returned by the `exec` operation. It has all of
 * standard io handles, and methods for synchronizing on return.
 */
export interface Process extends StdIO {

  readonly pid: number;

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
   * expansion;
   */
  shell?: boolean;

  /**
   * Sets the working directory of the process
   */
  cwd?: string;
}

export interface StdIO {
  stdout: OutputStream;
  stderr: OutputStream;
  stdin: Writable;
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
}

export interface ProcessResult extends ExitStatus {
  stdout: string;
  stderr: string;
}

export interface CreateOSProcess {
  (command: string, options: ExecOptions): Resource<Process>;
}
