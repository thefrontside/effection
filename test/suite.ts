import { expect } from "@std/expect";
export { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
export { expectType } from "ts-expect";
export { expect };

import { ctrlc } from "ctrlc-windows";

import type { Operation } from "../lib/types.ts";
import { resource, sleep, spawn, until } from "../mod.ts";

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

export function useCommand(
  cmd: string,
  options?: Deno.CommandOptions,
): Operation<Deno.ChildProcess> {
  return resource(function* (provide) {
    let command = new Deno.Command(cmd, options);
    let process = command.spawn();

    if (Deno.build.os === "windows") {
      // Wrap the kill method to use ctrlc-windows on Windows
      // See: https://github.com/denoland/deno/issues/29599
      const originalKill = process.kill.bind(process);
      process.kill = (signal) => {
        if (signal === "SIGINT") {
          ctrlc(process.pid);
        } else {
          originalKill(signal);
        }
      };
    }

    try {
      yield* provide(process);
    } finally {
      try {
        process.kill("SIGINT");
        yield* until(process.status);
      } catch (error) {
        // if the process already quit, then this error is expected.
        // unfortunately there is no way (I know of) to check this
        // before calling process.kill()

        if (
          !!error &&
          !(error as Error).message.includes(
            "Child process has already terminated",
          )
        ) {
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      }
    }
  });
}

interface Buffer {
  content: string;
}

export function buffer(stream: ReadableStream<Uint8Array>): Operation<Buffer> {
  return resource<{ content: string }>(function* (provide) {
    let buff = { content: " " };
    yield* spawn(function* () {
      let decoder = new TextDecoder();
      let reader = stream.getReader();

      try {
        let next = yield* until(reader.read());
        while (!next.done) {
          buff.content += decoder.decode(next.value);
          next = yield* until(reader.read());
        }
      } finally {
        yield* until(reader.cancel());
      }
    });

    yield* provide(buff);
  });
}

export function* detect(
  buffer: Buffer,
  text: string,
  options: { timeout: number } = { timeout: 1000 },
): Operation<void> {
  let start = new Date().getTime();

  while ((new Date().getTime() - start) < options.timeout) {
    if (buffer.content.includes(text)) {
      return;
    }
    yield* sleep(10);
  }

  expect(buffer.content).toMatch(new RegExp(text));
}
