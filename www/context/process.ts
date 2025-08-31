import type { Operation, Stream } from "effection";
import {
  action,
  createSignal,
  each,
  resource,
  spawn,
  until,
  withResolvers,
} from "effection";
import md5 from "md5";
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

export function urlFromCommand(command: string): URL {
  return new URL(`https://cache.local/${md5(command)}`);
}

export function* ProcessOutputCache(patterns: RegExp[]): Operation<void> {
  const cache = yield* until(caches.open("command-cache"));
  
  yield* processApi.around({
    *useProcess([command], next) {
      // Check if command matches any of the patterns
      const shouldCache = patterns.some(pattern => pattern.test(command));
      
      if (!shouldCache) {
        return yield* next(command);
      }
      
      const url = urlFromCommand(command);
      
      // Check if we have cached result
      const cachedResponse = yield* until(cache.match(url));
      
      if (cachedResponse) {
        // Return cached process with cached output
        return yield* createCachedProcess(cachedResponse);
      }
      
      // Execute the process normally
      const process = yield* next(command);
      
      // Capture stdout for caching
      let stdoutContent = "";
      
      const originalProcess = {
        [Symbol.iterator]: process[Symbol.iterator],
        stdout: createSignal<string, void>(),
        stderr: process.stderr,
        send: process.send,
      };
      
      // Proxy stdout and capture content
      yield* spawn(function* () {
        for (const chunk of yield* each(process.stdout)) {
          stdoutContent += chunk;
          originalProcess.stdout.send(chunk);
          yield* each.next();
        }
        originalProcess.stdout.close();
      });
      
      // Wait for process completion and cache result if successful
      yield* spawn(function* () {
        const result = yield* process;
        
        // Only cache successful operations
        if (result.code === 0) {
          yield* until(cache.put(url, new Response(stdoutContent.trim())));
        }
      });
      
      return originalProcess;
    }
  });
}

function* createCachedProcess(cachedResponse: Response): Operation<Process> {
  const stdoutContent = yield* until(cachedResponse.text());
  
  const stdout = createSignal<string, void>();
  const stderr = createSignal<string, void>();
  
  // Since signals are queues, we can write to them immediately
  stdout.send(stdoutContent.trim());
  stdout.close();
  stderr.close();
  
  return {
    *[Symbol.iterator] () {
      return { code: 0, signal: undefined };
    },
    stdout,
    stderr,
    *send(_signal: Deno.Signal) {
      // No-op for cached processes
    },
  } as Process;
}