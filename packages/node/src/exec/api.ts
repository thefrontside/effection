import { Task, Operation } from '@effection/core';
import { Stream } from '@effection/subscription';

// TODO: import from subscription package once #236 is merged
export interface Writable<T> {
  send(message: T): void;
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

  /**
   * Skip buffering of output streams
   */
  buffered?: boolean;
}

export interface StdIO {
  stdout: Stream<string>;
  stderr: Stream<string>;
  stdin: Writable<string>;
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


export interface CreateOSProcess {
  (scope: Task, command: string, options: ExecOptions): Process;
}
