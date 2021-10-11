/**
 * @hidden
 */
export interface MainErrorOptions {
  exitCode?: number;
  message?: string;
}

/**
 * Throwing this error inside of an operation running within {@link main}
 * is a way to abort the program without causing an error to be printed.
 *
 * When `main` fails, usually it will print a full stacktrace of the error it
 * failed with, but if the error was a `MainError`, the stack trace will not be
 * printed. If the optional `message` is given, it is printed instead.
 *
 * When running in node, the `exitCode` can option can be set to exit with a
 * different exit code.
 *
 * ### Example
 *
 * ``` typescript
 * import { main, MainError } from 'effection';
 * import { promises as fs } from 'fs';
 *
 * const { readFile } = fs;
 *
 * main(function*() {
 *   let fileName = process.argv[2];
 *   try {
 *     let content = yield readFile(fileName);
 *     console.log(content.reverse().toString());
 *   } catch(err) {
 *     throw new MainError({ message: `no such file ${fileName}`, exitCode: 200 });
 *   }
 * });
 * ```
 */
export class MainError extends Error {
  name = "EffectionMainError"

  public exitCode: number;

  constructor(options: MainErrorOptions = {}) {
    super(options.message || "");
    this.exitCode = options.exitCode || -1;
  }
}

/**
 * @hidden
 */
export function isMainError(error: Error): error is MainError {
  return error.name === 'EffectionMainError';
}
