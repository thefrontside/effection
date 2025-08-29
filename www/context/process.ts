import type { Operation, Stream } from "effection";
import {
  action,
  createSignal,
  resource,
  spawn,
  withResolvers,
} from "effection";
import { createApi } from "./context-api.ts";

export interface ProcessResult {
  code: number;
  signal?: Deno.Signal;
}

export interface Process extends Operation<ProcessResult> {
  stdout: Stream<string, void>;
  stderr: Stream<string, void>;
  send(signal: Deno.Signal): void;
}

export interface ProcessApi {
  useProcess(command: string): Operation<Process>;
}

export const processApi = createApi<ProcessApi>("process", {
  useProcess(command: string): Operation<Process> {
    return resource(function* (provide) {
      let closed = withResolvers<ProcessResult>();
      let stdout = createSignal<string, void>();
      let stderr = createSignal<string, void>();

      // Parse command and args for Deno.Command
      const args = command.split(" ");
      const cmd = args.shift()!;

      const denoCommand = new Deno.Command(cmd, {
        args,
        stdout: "piped",
        stderr: "piped",
      });

      let childProcess: Deno.ChildProcess;

      try {
        childProcess = denoCommand.spawn();
      } catch (error) {
        throw new Error(`Failed to spawn process: ${error}`);
      }

      // Handle stdout
      yield* spawn(function* () {
        const reader = childProcess.stdout.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = yield* action<
              ReadableStreamReadResult<Uint8Array>
            >((resolve) => {
              reader.read().then(resolve);
              return () => {};
            });

            if (done) break;

            const text = decoder.decode(value, { stream: true });
            stdout.send(text);
          }
        } finally {
          reader.releaseLock();
        }
      });

      // Handle stderr
      yield* spawn(function* () {
        const reader = childProcess.stderr.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = yield* action<
              ReadableStreamReadResult<Uint8Array>
            >((resolve) => {
              reader.read().then(resolve);
              return () => {};
            });

            if (done) break;

            const text = decoder.decode(value, { stream: true });
            stderr.send(text);
          }
        } finally {
          reader.releaseLock();
        }
      });

      // Handle process completion
      yield* spawn(function* () {
        const status = yield* action<Deno.CommandStatus>((resolve) => {
          childProcess.status.then(resolve);
          return () => {};
        });

        stdout.close();
        stderr.close();
        closed.resolve({
          code: status.code,
          signal: status.signal as Deno.Signal,
        });
      });

      yield* provide({
        [Symbol.iterator]: closed.operation[Symbol.iterator],
        stdout,
        stderr,
        *send(signal) {
          childProcess.kill(signal);
        },
      });
    });
  },
});

export const { useProcess } = processApi.operations;
