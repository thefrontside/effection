import { expect } from "@std/expect";
export { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
export { expectType } from "ts-expect";
export { expect };

import { ctrlc } from "ctrlc-windows";
import { spawn as nodeSpawn } from "node:child_process";
import type { ChildProcess as NodeChildProcess } from "node:child_process";
import type { Readable as NodeReadable } from "node:stream";

import type { Operation } from "../lib/types.ts";
import { resource, sleep, spawn, until, withResolvers } from "../mod.ts";

interface ChildProcess extends NodeChildProcess {
  status: Operation<{ code: number | null; signal: NodeJS.Signals | null }>;
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

export function useCommand(
  cmd: string,
  options?: {
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    stdin?: "piped" | "inherit" | "null";
    stdout?: "piped" | "inherit" | "null";
    stderr?: "piped" | "inherit" | "null";
  },
): Operation<ChildProcess> {
  return resource(function* (provide) {
    const nodeProcess = nodeSpawn(cmd, options?.args ?? [], {
      cwd: options?.cwd,
      env: options?.env,
      stdio: [
        options?.stdin === "piped"
          ? "pipe"
          : options?.stdin === "null"
          ? "ignore"
          : "inherit",
        options?.stdout === "piped"
          ? "pipe"
          : options?.stdout === "null"
          ? "ignore"
          : "inherit",
        options?.stderr === "piped"
          ? "pipe"
          : options?.stderr === "null"
          ? "ignore"
          : "inherit",
      ],
    });

    const status = withResolvers();

    nodeProcess.on("exit", (code, signal) => status.resolve({ code, signal }));
    nodeProcess.on("error", status.reject);

    const processWrapper = Object.assign(nodeProcess, {
      status: status.operation,
    }) as ChildProcess;

    if (processWrapper.pid && Deno.build.os === "windows") {
      // Wrap the kill method to use ctrlc-windows on Windows
      // See: https://github.com/denoland/deno/issues/29599
      const originalKill = processWrapper.kill.bind(processWrapper);
      processWrapper.kill = (signal?: NodeJS.Signals | number) => {
        if (signal === "SIGINT") {
          ctrlc(processWrapper.pid!);
          return true;
        } else {
          return originalKill(signal);
        }
      };
    }

    try {
      yield* provide(processWrapper);
    } finally {
      try {
        processWrapper.kill("SIGINT");
        yield* status.operation;
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

export function buffer(
  stream: NodeReadable | ReadableStream<Uint8Array> | null,
): Operation<Buffer> {
  return resource<{ content: string }>(function* (provide) {
    let buff = { content: " " };
    yield* spawn(function* () {
      let decoder = new TextDecoder();

      if (!stream) {
        return;
      }

      if ("getReader" in stream) {
        // ReadableStream (Web API)
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
      } else {
        // Node.js Readable stream
        const nodeStream = stream as NodeReadable;

        const readChunk = (): Promise<Uint8Array | null> => {
          return new Promise((resolve, reject) => {
            const onData = (chunk: Uint8Array) => {
              cleanup();
              resolve(chunk);
            };
            const onEnd = () => {
              cleanup();
              resolve(null);
            };
            const onError = (err: Error) => {
              cleanup();
              reject(err);
            };
            const cleanup = () => {
              nodeStream.off("data", onData);
              nodeStream.off("end", onEnd);
              nodeStream.off("error", onError);
            };

            nodeStream.on("data", onData);
            nodeStream.on("end", onEnd);
            nodeStream.on("error", onError);
          });
        };

        try {
          let chunk = yield* until(readChunk());
          while (chunk !== null) {
            buff.content += decoder.decode(chunk);
            chunk = yield* until(readChunk());
          }
        } catch (_error) {
          // Stream ended or error occurred
        }
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
