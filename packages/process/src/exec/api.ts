import { Operation, Resource } from '@effection/core';
import { IoStream, Writable } from '@effection/stream';
import { Stream } from 'stream';

export type StdIOOptionCommon = 'inherit' | 'ignore' | 'pipe' | 'overlapped' | undefined
export type StdIOOptionItem = StdIOOptionCommon | null | Stream;
export type StdIOOption = StdIOOptionCommon | StdIOOptionItem[];

/**
 * The process type is what is returned by the `exec` operation. It has all of
 * standard io handles, and methods for synchronizing on return.
 */
export interface Process extends Writable<any> {
  stdout: IoStream;
  stderr: IoStream;
  stdin: Writable<string>;

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
   * Sets the options for standard IO of the spawned process. See the
   * [ChildProcess documentation](https://nodejs.org/api/child_process.html#child_process_options_stdio)
   * for more information.
   */
  stdio?: StdIOOption
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
