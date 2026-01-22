import { type Operation, until } from "effection";
import { $ } from "../context/shell.ts";
import * as fs from "@std/fs";

export function ensureDir(dir: string | URL) {
  return until(fs.ensureDir(dir));
}

export function writeTextFile(
  path: string | URL,
  data: string | ReadableStream<string>,
  options?: Deno.WriteFileOptions,
) {
  return until(Deno.writeTextFile(path, data, options));
}

export interface GitCommit {
  sha: string;
  message: string;
  tags: string[];
}

/**
 * Gets git commit history from current directory in chronological order with detailed info
 * @returns Array of commits with sha, message, and tags in chronological order (oldest first)
 */
export function* getGitHistory(): Operation<GitCommit[]> {
  // Get commit history with hash and message
  let historyResult = yield* $(`git log --format="%H|%s" --reverse`);

  let lines = historyResult.stdout.split("\n").filter((line) =>
    line.length > 0
  );
  let commits: GitCommit[] = [];

  for (let line of lines) {
    let [sha, message] = line.split("|");

    // Get tags for this commit using $ shell utility
    try {
      let tagsResult = yield* $(`git tag --points-at ${sha}`);
      let tags = tagsResult.stdout.split("\n").filter((tag) => tag.length > 0);
      commits.push({ sha, message, tags });
    } catch {
      // No tags for this commit
      commits.push({ sha, message, tags: [] });
    }
  }

  return commits;
}
