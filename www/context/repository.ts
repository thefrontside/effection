import { each, Operation, spawn } from "effection";
import type { Repository, RepositoryRef } from "../repository/types.ts";
import {
  getPath,
  getRefUrl,
  matchRef,\n  REF_PATTERN,
} from "../repository/utils.ts";
import { createApi } from "./context-api.ts";
import { useProcess } from "./process.ts";

interface UseRepositoryParams {
  owner: string;
  name: string;
}

interface UseRefParams {
  repository: Repository;
  ref: string;
}

interface Repositories {
  useRepository({ owner, name }: UseRepositoryParams): Operation<Repository>;
  useRef({ repository, ref }: UseRefParams): Operation<RepositoryRef>;
}

export const repositoriesApi = createApi<Repositories>("repositories", {
  *useRepository({ owner, name }) {
    const nameWithOwner = `${owner}/${name}`;
    const url = `git@github.com:${nameWithOwner}.git`;

    if (!(yield* checkRemoteExists(nameWithOwner))) {
      yield* addRemote(nameWithOwner, url);
      yield* fetchRemote(nameWithOwner);
    }

    const repository: Repository = {
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
      *loadRef(ref?: string) {
        if (!ref) {
          const default_branch = yield* getDefaultBranch(nameWithOwner);
          ref = `heads/${default_branch}`;
        }
        const parts = ref.match(REF_PATTERN);
        if (parts) {
          ref = parts[0];
        } else {
          throw new Error(
            `Expected ref in format heads/<ref> or tags/<ref> (refs/ is ignored) but got ${ref}`,
          );
        }

        return yield* useRef({
          repository,
          ref,
        });
      },
    };

    return repository;
  },

  *useRef({ repository, ref: _ref }) {
    const ref = matchRef(_ref);

    if (!ref) throw new Error(`Could not normalize ${_ref}`);

    const url = getRefUrl(repository, ref);

    const repositoryRef: RepositoryRef = {
      repository,
      ...ref,

      url,

      getUrl(base, target, isFile) {
        return new URL(
          [
            isFile ? "blob" : "tree",
            ref.name,
            getPath(base ?? "", target ?? ""),
          ]
            .filter(Boolean)
            .join("/"),
          `https://github.com/${repository.nameWithOwner}/`,
        );
      },

      getContent(path: string) {
        return getContent(repository.nameWithOwner, _ref, path);
      },
    };

    return repositoryRef;
  },
});

export const { useRepository, useRef } = repositoriesApi.operations;

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
    for (const chunk of yield* each(process.stdout)) {
      output += chunk;
      yield* each.next();
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
): Operation<{ name: string }[]> {
  const process = yield* useProcess(
    `git ls-remote --tags ${remote} "${pattern}"`,
  );

  let output = "";
  yield* spawn(function* () {
    for (const chunk of yield* each(process.stdout)) {
      output += chunk;
      yield* each.next();
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
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .map((name) => ({ name })); // Remove duplicates
  }

  return [];
}

function* getContent(
  remote: string,
  ref: string,
  path: string,
): Operation<string> {
  const process = yield* useProcess(`git show 
  ${remote}/${ref}:${path}`);

  let output = "";
  let errorOutput = "";

  yield* spawn(function* () {
    for (const chunk of yield* each(process.stdout)) {
      output += chunk;
      yield* each.next();
    }
  });

  yield* spawn(function* () {
    for (const chunk of yield* each(process.stderr)) {
      errorOutput += chunk;
      yield* each.next();
    }
  });

  const result = yield* process;

  if (result.code === 0) {
    return output;
  } else {
    throw new Error(`Failed to get remote file content: ${errorOutput}`);
  }
}
