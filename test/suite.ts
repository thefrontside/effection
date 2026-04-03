import { expect } from "@std/expect";
import { ctrlc } from "ctrlc-windows";
import { type KillSignal, type Options, type Output, x as $x } from "tinyexec";
export { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
export { expectType } from "ts-expect";
export { expect };

import type { Operation, Stream } from "../lib/types.ts";
import { resource, sleep, spawn, stream, until } from "../mod.ts";

export function* createNumber(value: number): Operation<number> {
  yield* sleep(1);
  return value;
}

export function* blowUp<T>(): Operation<T> {
  yield* sleep(1);
  throw new Error("boom");
}

export function* asyncResolve(
  duration: number,
  value: string,
): Operation<string> {
  yield* sleep(duration);
  return value;
}

export function* asyncReject(
  duration: number,
  value: string,
): Operation<string> {
  yield* sleep(duration);
  throw new Error(`boom: ${value}`);
}

export function asyncResource(
  duration: number,
  value: string,
  status: { status: string },
): Operation<string> {
  return resource(function* AsyncResource(provide) {
    yield* spawn(function* () {
      yield* sleep(duration + 10);
      status.status = "active";
    });
    yield* sleep(duration);
    yield* provide(value);
  });
}

export function* syncResolve(value: string): Operation<string> {
  return value;
}

export function* syncReject(value: string): Operation<string> {
  throw new Error(`boom: ${value}`);
}
export interface TinyProcess extends Operation<Output> {
  /**
   * A stream of lines coming from both stdin and stdout. The stream
   * will terminate when stdout and stderr are closed which usually
   * corresponds to the process ending.
   */
  lines: Stream<string, void>;

  /**
   * Send `signal` to this process
   * @param signal - the OS signal to send to the process
   * @returns void
   */
  kill(signal?: KillSignal): Operation<Output>;
}

export interface TinyProcess extends Operation<Output> {
  /**
   * A stream of lines coming from both stdin and stdout. The stream
   * will terminate when stdout and stderr are closed which usually
   * corresponds to the process ending.
   */
  lines: Stream<string, void>;

  /**
   * Send `signal` to this process
   * @param signal - the OS signal to send to the process
   * @returns void
   */
  kill(signal?: KillSignal): Operation<Output>;
}

// POSIX conventional exit codes for signals (128 + signal number).
// Deno 2.6.9+ (denoland/deno#32081) sets ChildProcess.exitCode to null
// for signal-killed processes (matching Node.js semantics), so tinyexec
// returns exitCode: undefined. We derive the conventional code ourselves.
const SIGNAL_EXIT_CODES: Record<string, number> = {
  SIGHUP: 129,
  SIGINT: 130,
  SIGQUIT: 131,
  SIGTERM: 143,
};

export function x(
  cmd: string,
  args: string[] = [],
  options?: Partial<Options>,
): Operation<TinyProcess> {
  return resource(function* (provide) {
    let tinyexec = $x(cmd, args, { ...options });

    let promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

    let output = until(promise);

    let tinyproc: TinyProcess = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(tinyexec),
      *kill(signal) {
        if (
          Deno.build.os === "windows" && signal === "SIGINT" && tinyexec.pid
        ) {
          ctrlc(tinyexec.pid);
        } else {
          tinyexec.kill(signal);
        }
        let result = yield* output;

        if (result.exitCode === undefined && signal) {
          let code = SIGNAL_EXIT_CODES[signal];
          if (code !== undefined) {
            return { ...result, exitCode: code };
          }
        }

        return result;
      },
    };

    try {
      yield* provide(tinyproc);
    } finally {
      yield* tinyproc.kill();
    }
  });
}
