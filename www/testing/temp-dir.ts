import { type Operation, resource, until } from "effection";
import { ensureDir, ensureFile } from "@std/fs";
import { join } from "@std/path";

function* writeFiles(
  dir: string,
  files: Record<string, string>,
): Operation<void> {
  for (let [path, content] of Object.entries(files)) {
    yield* until(ensureFile(join(dir, path)));
    yield* until(Deno.writeTextFile(join(dir, path), content));
  }
}

export interface TempDir {
  withFiles(files: Record<string, string>): Operation<void>;
  withWorkspace(
    workspace: string,
    files: Record<string, string>,
  ): Operation<void>;
  path: string;
}

interface CreateTempDirParams {
  autoClean?: boolean;
  baseDir?: string;
}

export function createTempDir(
  params?: CreateTempDirParams,
): Operation<TempDir> {
  return resource(function* (provide) {
    let {
      baseDir,
      autoClean,
    } = params || {};
    let dir: string;

    if (baseDir) {
      // Create directory in specified base directory
      yield* until(ensureDir(baseDir));
      let timestamp = Date.now().toString(36);
      let randomSuffix = Math.random().toString(36).substring(2, 8);
      let dirName = `${timestamp}-${randomSuffix}`;
      dir = join(baseDir, dirName);
      yield* until(ensureDir(dir));
    } else {
      // Fall back to system temp directory
      dir = yield* until(Deno.makeTempDir());
    }

    try {
      yield* provide({
        get path() {
          return dir;
        },
        *withFiles(files: Record<string, string>) {
          yield* writeFiles(dir, files);
        },
        *withWorkspace(workspace: string, files: Record<string, string>) {
          yield* writeFiles(join(dir, workspace), files);
        },
      });
    } finally {
      // Only remove if we created it (not if it's in a managed base directory)
      if (autoClean) {
        yield* until(Deno.remove(dir, { recursive: true }));
      }
    }
  });
}
