import type { Operation, Stream } from "effection";
import { each, spawn, until, withResolvers } from "effection";
import md5 from "md5";
import { regex } from "arktype";
import { createApi } from "./context-api.ts";
import { exec, ExecOptions, ProcessResult } from "@effectionx/process";
import { log } from "./logging.ts";
import { cwd, useCwd } from "./shell.ts";
import { fileURLToPath } from "node:url";

export interface ProcessApi {
  useProcess(command: string, options?: ExecOptions): Operation<ProcessResult>;
}

export const processApi = createApi<ProcessApi>("process", {
  *useProcess(command: string, options): Operation<ProcessResult> {
    let cwd = yield* useCwd();
    return yield* exec(command, {
      cwd,
      ...options,
    }).expect();
  },
});

export let { useProcess } = processApi.operations;

export function* drain(source: Stream<string, void>): Operation<string> {
  let complete = withResolvers<string>();
  yield* spawn(function* () {
    let chunks = "";
    for (let chunk of yield* each(source)) {
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
  let cache = yield* until(caches.open("command-cache"));

  yield* processApi.around({
    *useProcess([command], next) {
      // Check if command matches any of the patterns
      let shouldCache = patterns.some((pattern) => pattern.test(command));

      if (!shouldCache) {
        return yield* next(command);
      }

      let url = urlFromCommand(command);

      // Check if we have cached result
      let cachedResponse = yield* until(cache.match(url));
      if (cachedResponse) {
        // Return cached process with cached output
        return yield* createCachedProcess(cachedResponse);
      }

      // Execute the process normally
      let process = yield* next(command);

      yield* until(cache.put(url, new Response(process.stdout)));

      // Fallback to original process if caching failed
      return process;
    },
  });
}

function* createCachedProcess(
  cachedResponse: Response,
): Operation<ProcessResult> {
  return {
    stdout: yield* until(cachedResponse.text()),
    stderr: "",
    code: 0,
  };
}

// Pattern for git show commands with named capture groups
export let gitShowPattern = regex(
  "^git show (?<owner>[^/]+)/(?<repo>[^/]+)/(?<branch>[^:]+):(?<path>.+)$",
);

/**
 * Check if the current HEAD is a descendant of a given branch/ref
 */
function* isDescendantOf(ref: string): Operation<boolean> {
  try {
    let result = yield* exec(
      `git merge-base --is-ancestor ${ref} HEAD`,
    ).expect();
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * Middleware that intercepts git show commands and reads from filesystem instead
 * when the current origin matches and HEAD descends from the target branch
 */
export function* ProcessFileSystemRead(
  pattern: typeof gitShowPattern,
): Operation<void> {
  yield* processApi.around({
    *useProcess([command], next) {
      let match = pattern.exec(command);

      if (!match) {
        return yield* next(command);
      }

      let { owner, repo, branch, path: filePath } = match.groups;
      let repoPath = `${owner}/${repo}`;
      let remote = `${owner}/${repo}/${branch}`;

      // Check if origin matches the repository
      let originResult = yield* exec("git remote get-url origin").expect();
      let originUrl = originResult.stdout.trim();

      if (!originUrl.includes(repoPath)) {
        yield* log.debug(
          `Origin ${originUrl} does not match repository ${repoPath}, executing command normally`,
        );
        return yield* next(command);
      }

      let isDescendant = yield* isDescendantOf(remote);

      if (!isDescendant) {
        yield* log.debug(
          `Current HEAD is not a descendant of ${remote}, executing command normally`,
        );
        return yield* next(command);
      }

      try {
        yield* log.debug(
          `Reading ${filePath} from filesystem instead of executing: ${command}`,
        );
        let basePath = fileURLToPath(new URL("../../", import.meta.url));
        let [process] = yield* cwd(basePath, [next(`cat ${filePath}`)]);
        return process;
      } catch (error) {
        yield* log.debug(
          `Failed to read ${filePath}, falling back to command execution: ${error}`,
        );
        return yield* next(command);
      }
    },
  });
}
