import {
  each,
  type Operation,
  spawn,
  type Stream,
  until,
  withResolvers,
} from "effection";
import { Process, useProcess } from "../context/process.ts";
import * as fs from "@std/fs";

export function ensureDir(dir: string | URL) {
  return until(fs.ensureDir(dir));
}

export function writeTextFile(path: string | URL, data: string | ReadableStream<string>, options?: Deno.WriteFileOptions) {
  return until(Deno.writeTextFile(path, data, options));
}

export function* capture(
  op: Operation<Process>,
): Operation<
  { stdout: string; stderr: string; code: number; signal?: Deno.Signal }
> {
  const process = yield* op;
  
  const stdout = withResolvers<string>();
  const stderr = withResolvers<string>();

  yield* spawn(function* () {
    stdout.resolve(yield* drain(process.stdout));
  });
  yield* spawn(function* () {
    stderr.resolve(yield* drain(process.stderr));
  });

  return {
    ...yield* process,
    stdout: yield* stdout.operation,
    stderr: yield* stderr.operation,
  };
}

export interface GitCommit {
  sha: string;
  message: string;
  tags: string[];
}

/**
 * Gets git commit history from a repository in chronological order with detailed info
 * @param repoDir Directory containing the git repository
 * @returns Array of commits with sha, message, and tags in chronological order (oldest first)
 */
export function* getGitHistory(repoDir: string): Operation<GitCommit[]> {
  // Get commit history with hash and message
  const historyProcess = yield* capture(
    useProcess(`git log --format="%H|%s" --reverse`, { cwd: repoDir })
  );
  
  if (historyProcess.code !== 0) {
    throw new Error(`Failed to get git history: ${historyProcess.stderr}`);
  }
  
  const lines = historyProcess.stdout.trim().split('\n').filter(line => line.length > 0);
  const commits: GitCommit[] = [];
  
  for (const line of lines) {
    const [sha, message] = line.split('|');
    
    // Get tags for this commit
    const tagsProcess = yield* capture(
      useProcess(`git tag --points-at ${sha}`, { cwd: repoDir })
    );
    
    const tags = tagsProcess.code === 0 
      ? tagsProcess.stdout.trim().split('\n').filter(tag => tag.length > 0)
      : [];
    
    commits.push({ sha, message, tags });
  }
  
  return commits;
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
