import { type Operation, resource, until } from "effection";
import { ensureFile, ensureDir } from "@std/fs";
import { join } from "@std/path";

function* writeFiles(
  dir: string,
  files: Record<string, string>,
): Operation<void> {
  for (const [path, content] of Object.entries(files)) {
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

export function createTempDir(
  { 
    prefix = "ex-publisher-test-", 
    baseDir 
  }: { 
    prefix?: string; 
    baseDir?: string; 
  } = {},
): Operation<TempDir> {
  return resource(function* (provide) {
    let dir: string;
    
    if (baseDir) {
      // Create directory in specified base directory
      yield* until(ensureDir(baseDir));
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const dirName = `${prefix}${timestamp}-${randomSuffix}`;
      dir = join(baseDir, dirName);
      yield* until(ensureDir(dir));
    } else {
      // Fall back to system temp directory
      dir = yield* until(Deno.makeTempDir({ prefix }));
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
      if (!baseDir) {
        yield* until(Deno.remove(dir, { recursive: true }));
      }
    }
  });
}