import { Operation, spawn } from "effection";
import type { Repository } from "../resources/repository.ts";
import { createApi } from "./context-api.ts";
import { useProcess } from "./process.ts";

interface UrlRepositoryParams {
  owner: string;
  name: string;
}

interface Repositories {
  useRepository({ owner, name }: UrlRepositoryParams): Operation<Repository>;
}

export const RepositoriesApi = createApi<Repositories>("repositories", {
  *useRepository({ owner, name }) {
    const nameWithOwner = `${owner}/${name}`;
    const url = `git@github.com:${nameWithOwner}.git`;

    if (!(yield* checkRemoteExists(nameWithOwner))) {
      yield* addRemote(nameWithOwner, url);
      yield* fetchRemote(nameWithOwner);
    }

    return {
      owner,
      name,
      nameWithOwner,
      getDefaultBranch() {
        return getDefaultBranch(nameWithOwner);
      },
      getStarCount() {
        throw new Error(`getStartCount is not implemented`);
      },
      tags(ref) {
        return getMatchingTags(nameWithOwner, `${ref}*`);
      },
      *getContent(path) {
        const defaultBranch = yield* getDefaultBranch(nameWithOwner);
        return yield* getContent(nameWithOwner, defaultBranch, path);
      },
      loadRef() {},
    };
  },
});

function* checkRemoteExists(remoteName: string): Operation<boolean> {
  const process = yield* useProcess(`git remote get-url ${remoteName}`);
  const result = yield* process;

  // Exit code 0 means remote exists, non-zero means it doesn't
  return result.code === 0;
}

function* addRemote(remote: string, url: string): Operation<void> {
  // Add remote
  const addProcess = yield* useProcess(`git remote add ${remote} ${url}`);
  const addResult = yield* addProcess;

  if (addResult.code !== 0) {
    throw new Error(`Failed to add remote: exit code ${addResult.code}`);
  }
}

function* fetchRemote(remote: string) {
  // Fetch from remote
  const fetchProcess = yield* useProcess(`git fetch ${remote}`);
  const fetchResult = yield* fetchProcess;

  if (fetchResult.code !== 0) {
    throw new Error(`Failed to fetch: exit code ${fetchResult.code}`);
  }
}

function* getDefaultBranch(remote: string): Operation<string> {
  const process = yield* useProcess(`git ls-remote --symref ${remote} HEAD`);

  let output = "";
  yield* spawn(function* () {
    for (const chunk of process.stdout) {
      output += chunk;
    }
  });

  const result = yield* process;

  if (result.code === 0) {
    // Output looks like: "ref: refs/heads/main    HEAD"
    const match = output.match(/^ref: refs\/heads\/(.+?)\s+HEAD/m);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Failed to get default branch`);
}

function* getMatchingTags(
  remote: string,
  pattern?: string,
): Operation<string[]> {
  const process = yield* useProcess(
    `git ls-remote --tags ${remote} "${pattern}"`,
  );

  let output = "";
  yield* spawn(function* () {
    for (const chunk of process.stdout) {
      output += chunk;
    }
  });

  const result = yield* process;

  if (result.code === 0) {
    // Parse output: "hash    refs/tags/tagname"
    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const match = line.match(/refs\/tags\/(.+?)(\^\{\})?$/);
        return match ? match[1] : null;
      })
      .filter((tag): tag is string => tag !== null)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  }

  return [];
}

function* getContent(
  remote: string,
  ref: string,
  path: string,
): Operation<string | null> {
  const process = yield* useProcess(`git show 
  ${remote}/${ref}:${path}`);

  let output = "";
  let errorOutput = "";

  yield* spawn(function* () {
    for (const chunk of process.stdout) {
      output += chunk;
    }
  });

  yield* spawn(function* () {
    for (const chunk of process.stderr) {
      errorOutput += chunk;
    }
  });

  const result = yield* process;

  if (result.code === 0) {
    return output;
  } else {
    console.error(`Failed to get remote file content: 
  ${errorOutput}`);
    return null;
  }
}
