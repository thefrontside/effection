import type { Operation, Stream, Subscription } from "effection";
import {
  createSignal,
  each,
  resource,
  spawn,
  until,
  useScope,
  withResolvers,
} from "effection";
import md5 from "md5";
import { createApi } from "./context-api.ts";
import { colors, log } from "./logging.ts";
import { splitCommand } from "../lib/command-parser.ts";

export interface ProcessResult {
  code: number;
  signal?: Deno.Signal;
}

export interface Process extends Operation<ProcessResult> {
  stdout: Stream<string, void>;
  stderr: Stream<string, void>;
  send(signal: Deno.Signal): void;
}

export interface ProcessOptions {
  cwd?: string | URL;

  env?: Record<string, string>;
}

export interface ProcessApi {
  useProcess(command: string, options?: ProcessOptions): Operation<Process>;
}

export const processApi = createApi<ProcessApi>("process", {
  useProcess(command: string, options): Operation<Process> {
    return resource(function* (provide) {
      let closed = withResolvers<ProcessResult>();
      let stdoutComplete = withResolvers<void>();
      let stderrComplete = withResolvers<void>();
      let stdout = createSignal<string, void>();
      let stderr = createSignal<string, void>();

      // Parse command and args for Deno.Command
      const args = splitCommand(command);
      const cmd = args.shift()!;

      const denoCommand = new Deno.Command(cmd, {
        args,
        stdout: "piped",
        stderr: "piped",
        ...options,
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
            let result: ReadableStreamReadResult<Uint8Array>;
            try {
              result = yield* until(reader.read());
            } catch (e) {
              yield* log.error(`Failed to read stdout`, { cause: e });
              throw e;
            }

            const text = decoder.decode(result.value, { stream: true });
            stdout.send(text);
            if (result.done) break;
          }
        } finally {
          reader.releaseLock();
          stdoutComplete.resolve();
        }
      });

      // Handle stderr
      yield* spawn(function* () {
        const reader = childProcess.stderr.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            let result: ReadableStreamReadResult<Uint8Array>;
            try {
              result = yield* until(reader.read());
            } catch (e) {
              yield* log.error(`Failed to read stderr`, { cause: e });
              throw e;
            }

            const text = decoder.decode(result.value, { stream: true });
            stdout.send(text);

            if (result.done) break;
          }
        } finally {
          reader.releaseLock();
          stderrComplete.resolve();
        }
      });

      // Handle process completion
      yield* spawn(function* () {
        let status: Deno.CommandStatus;
        try {
          status = yield* until(childProcess.status);
        } catch (e) {
          throw new Error(`Command failed: ${command}`, { cause: e });
        }

        yield* stdoutComplete.operation;
        stdout.close();

        yield* stderrComplete.operation;
        stderr.close();

        // Log command completion with status
        yield* log.debug(
          `${
            status.code === 0
              ? `${colors.green}0${colors.reset}`
              : `${colors.red}${status.code}${colors.reset}`
          }: ${command}`,
        );

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

export function* capture(
  op: Operation<Process>,
): Operation<
  { stdout: string; stderr: string; code: number; signal?: Deno.Signal }
> {
  const process = yield* op;

  const stdout = withResolvers<string>();
  const stderr = withResolvers<string>();

  yield* spawn(function* () {
    const output = yield* drain(process.stdout);
    stdout.resolve(output);
  });
  yield* spawn(function* () {
    const output = yield* drain(process.stderr);
    stderr.resolve(output);
  });

  const result = yield* process;

  const stdoutResult = yield* stdout.operation;
  const stderrResult = yield* stderr.operation;

  return {
    ...result,
    stdout: stdoutResult.trim(),
    stderr: stderrResult.trim(),
  };
}

export function* drain(source: Stream<string, void>): Operation<string> {
  const complete = withResolvers<string>();
  yield* spawn(function* () {
    let chunks = "";
    for (const chunk of yield* each(source)) {
      chunks += chunk;
      yield* each.next();
    }
    complete.resolve(chunks);
  });

  return yield* complete.operation;
}

export function urlFromCommand(command: string): URL {
  return new URL(`https://cache.local/${md5(command)}`);
}

export function* ProcessOutputCache(patterns: RegExp[]): Operation<void> {
  const cache = yield* until(caches.open("command-cache"));

  yield* processApi.around({
    *useProcess([command], next) {
      // Check if command matches any of the patterns
      const shouldCache = patterns.some((pattern) => pattern.test(command));

      if (!shouldCache) {
        return yield* next(command);
      }

      const url = urlFromCommand(command);

      // Check if we have cached result
      const cachedResponse = yield* until(cache.match(url));
      if (cachedResponse) {
        // Return cached process with cached output
        return createCachedProcess(cachedResponse);
      }
      // Execute the process normally
      const process = yield* next(command);

      const iterable = yield* toAsyncIterable(yield* process.stdout);

      // Convert string iterable to Uint8Array iterable for ReadableStream
      const encoder = new TextEncoder();
      const byteIterable = async function* () {
        for await (const chunk of iterable) {
          if (typeof chunk === "string") {
            yield encoder.encode(chunk);
          } else {
            yield chunk;
          }
        }
      }();

      yield* until(
        cache.put(url, new Response(ReadableStream.from(byteIterable))),
      );

      const result = yield* until(cache.match(url));

      if (result) {
        return createCachedProcess(result);
      }

      // Fallback to original process if caching failed
      return process;
    },
  });
}

export function* toAsyncIterable<T>(
  subscription: Subscription<T, unknown>,
): Operation<AsyncIterable<T>> {
  const scope = yield* useScope();

  return {
    async *[Symbol.asyncIterator]() {
      function* pullNext() {
        try {
          return yield* subscription.next();
        } catch (e) {
          yield* log.error(`toAsyncIterable encountered ${e}`);
          throw e;
        }
      }
      let next = await scope.run(pullNext);

      while (true) {
        if (!next.done) {
          yield next.value;
        } else {
          break;
        }
        next = await scope.run(pullNext);
      }
      return next.value;
    },
  };
}

function createCachedProcess(cachedResponse: Response): Process {
  const stdout = createSignal<string, void>();
  const stderr = createSignal<string, void>();

  return {
    *[Symbol.iterator]() {
      // Since signals are queues, we can write to them immediately
      stdout.send(yield* until(cachedResponse.text()));
      stderr.send("");
      stdout.close();
      stderr.close();
      return { code: 0, signal: undefined };
    },
    stdout,
    stderr,
    *send(_signal: Deno.Signal) {
      // No-op for cached processes
    },
  };
}
