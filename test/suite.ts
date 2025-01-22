export { expect } from "@std/expect";
export { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
export { expectType } from "ts-expect";
import {
  type KillSignal,
  type Options,
  type Output,
  x as $x,
} from "tinyexec";

import type { Operation, Stream } from "../lib/types.ts";
import { call, resource, sleep, spawn, stream } from "../mod.ts";

export function $await<T>(promise: Promise<T>): Operation<T> {
  return call(() => promise);
}

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

export function x(
  cmd: string,
  args: string[] = [],
  options?: Partial<Options>,
): Operation<TinyProcess> {
  return resource(function* (provide) {
    let tinyexec = $x(cmd, args, { ...options });

    let promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

    let output = call(() => promise);

    let tinyproc: TinyProcess = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(tinyexec),
      *kill(signal) {
        tinyexec.kill(signal);
        return yield* output;
      }
    };

    try {
      yield* provide(tinyproc);
    } finally {
      yield* tinyproc.kill();
    }
  });
}