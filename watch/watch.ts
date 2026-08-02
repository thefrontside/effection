import { access } from "node:fs/promises";
import { join, relative } from "node:path";
import chokidar, { type EmitArgsWithName } from "chokidar";
import {
  call,
  createChannel,
  createSignal,
  ensure,
  Err,
  Ok,
  type Operation,
  resource,
  type Result,
  spawn,
  type Stream,
  until,
  withResolvers,
} from "effection";
import { default as createIgnore } from "ignore";
import { pipe } from "remeda";
import { readFile } from "node:fs/promises";
import { exec, type ExecOptions, type Process } from "@effectionx/process";

import { debounce } from "./stream-helpers.ts";

// Extended FSWatcher interface that includes EventEmitter methods
interface FSWatcherWithEvents {
  on(event: string, listener: (...args: EmitArgsWithName) => void): this;
  close(): Promise<void>;
}

/**
 * Represents a single start of the specified command
 */
export interface Start {
  /**
   * A result containing the {Process} on a successful start, or
   * an error otherwise.
   */
  result: Result<Process>;
  /**
   * An operation that resolves when the current start begins its
   * shutdown.
   */
  restarting: Operation<void>;
}

/**
 * A watch is a strema of process starts that happen in reaction
 * to some source file changing on the file system.
 */
export interface Watch extends Stream<Result<Process>, never> {}

/**
 * Options available to configure what is watched
 */
export interface WatchOptions {
  /**
   * The directory to watch
   */
  path: string;
  /**
   * The command to run (and re-run every time a change is detected)
   */
  cmd: string;

  /**
   * @ignore
   */
  event?: "all" | "change";

  /**
   * Options passed to process exec
   */
  execOptions?: ExecOptions;
}

/**
 * Create a watch configuration that observes file system changes and executes a command
 * when changes are detected. The watch can be consumed as a stream of process starts.
 *
 * @example
 * ```ts
 * const watcher = yield* watch({
 *  path: './src',
 *  cmd: 'npm test'
 * });
 * ```
 *
 * @param options - Configuration options for the watch
 * @param options.path - The directory path to watch for changes
 * @param options.cmd - The command to execute when changes are detected
 * @param options.event - The type of event to watch for ('all' or 'change', defaults to 'all')
 *
 * @returns A Stream that emits `Result<Process>` for each command execution
 *
 * @remarks
 * - Uses chokidar for file system watching
 * - Respects .gitignore patterns if present
 * - Implements debouncing to prevent rapid successive executions
 * - Filters out stale events using the fresh() function
 *
 * @throws Will throw an error if the process execution fails
 *
 * @see {@link WatchOptions} for configuration options
 * @see {@link Process} for process execution details
 */
export function watch(options: WatchOptions): Stream<Start, never> {
  return resource(function* (provide) {
    let starts = createChannel<Start, never>();
    let input = createSignal<EmitArgsWithName, never>();

    let gitignored = yield* findIgnores(options.path);

    // Cast to extended interface that includes EventEmitter methods
    let watcher = chokidar.watch(options.path, {
      ignored: (path) => {
        let relpath = relative(options.path, path);
        let isGit = relpath === ".git" || relpath.startsWith(".git");
        return isGit || gitignored(path);
      },
      ignoreInitial: true,
    }) as unknown as FSWatcherWithEvents;

    let { event = "all" } = options;
    watcher.on(event, (...args: EmitArgsWithName) => {
      if (event !== "all") {
        args.unshift(event);
      }
      let [, path] = args;
      if (fresh(500)(args) && !gitignored(path)) {
        input.send(args);
      }
    });

    let changes = yield* pipe(input, debounce(100));
    let subscription = yield* starts;

    yield* spawn(function* () {
      while (true) {
        let task = yield* spawn(function* () {
          let restarting = withResolvers<void>();
          try {
            let process = yield* exec(options.cmd, options.execOptions);
            yield* starts.send({
              result: Ok(process),
              restarting: restarting.operation,
            });
          } catch (error) {
            yield* starts.send({
              result: Err(error as Error),
              restarting: restarting.operation,
            });
          }
          yield* changes.next();
          restarting.resolve();
        });
        yield* task;
      }
    });

    yield* ensure(() => until(watcher.close()));

    yield* provide(subscription);
  });
}

/**
 * locate a `.gitignore` file if it exists and use it to filter
 * out any change events against paths that are matched by it
 */
function* findIgnores(path: string): Operation<(path: string) => boolean> {
  let gitignore = join(path, ".gitignore");
  if (
    yield* call(() =>
      access(gitignore).then(
        () => true,
        () => false,
      ),
    )
  ) {
    let ignores = createIgnore();
    let buffer = yield* call(() => readFile(gitignore));
    ignores.add(buffer.toString());
    return (pathname) => {
      let relativePathname = relative(path, pathname).trim();
      return relativePathname !== "" && ignores.ignores(relativePathname);
    };
  }
  return () => false;
}

function fresh(staletime: number): (args: EmitArgsWithName) => boolean {
  return ([, , stats]) => {
    return !stats || Date.now() - stats.mtimeMs < staletime;
  };
}
