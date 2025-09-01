import { each, Operation, spawn } from "effection";
import { useProcess } from "../context/process.ts";
import type {
  Repository,
  RepositoryRef,
  UseRepositoryParams,
} from "./types.ts";
import { getPath, getRefUrl, matchRef } from "./utils.ts";
import { getStarCount } from "./octokit-provider.ts";

/**
 * Check if a git remote exists
 */
function* checkRemoteExists(remoteName: string): Operation<boolean> {
  const process = yield* useProcess(`git remote get-url ${remoteName}`);
  const result = yield* process;
  // Exit code 0 means remote exists, non-zero means it doesn't
  return result.code === 0;
}

/**
 * Add a git remote
 */
function* addRemote(remote: string, url: string): Operation<void> {
  const addProcess = yield* useProcess(`git remote add ${remote} ${url}`);
  const addResult = yield* addProcess;

  if (addResult.code !== 0) {
    throw new Error(`Failed to add remote: exit code ${addResult.code}`);
  }
}

/**
 * Fetch from a git remote
 */
function* fetchRemote(remote: string): Operation<void> {
  const fetchProcess = yield* useProcess(`git fetch ${remote}`);
  const fetchResult = yield* fetchProcess;

  if (fetchResult.code !== 0) {
    throw new Error(`Failed to fetch: exit code ${fetchResult.code}`);
  }
}

/**
 * Get default branch for a repository using git commands
 */
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

/**
 * Get tags for a repository matching a pattern using git commands
 */
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

/**
 * Get content of a file from repository using git commands
 */
export function* lookupTagCommit({ remoteName, tagName, workingDir }: {
  remoteName: string;
  tagName: string;
  workingDir?: string;
}): Operation<string | undefined> {
  const gitCmd = `git ${
    workingDir ? `-C "${workingDir}"` : ""
  } ls-remote --tags ${remoteName}`;

  const listTagsProcess = yield* useProcess(gitCmd);

  let tagOutput = "";
  yield* spawn(function* () {
    for (const chunk of yield* each(listTagsProcess.stdout)) {
      tagOutput += chunk;
      yield* each.next();
    }
  });

  const result = yield* listTagsProcess;

  if (result.code === 0) {
    const lines = tagOutput.trim().split("\n").filter((line) =>
      line.length > 0
    );
    
    // Look for the dereferenced tag (^{}) which points to the actual commit
    const dereferencedLine = lines.find((line) =>
      line.includes(`refs/tags/${tagName}^{}`)
    );
    
    if (dereferencedLine) {
      // Return the commit hash from the dereferenced tag
      return dereferencedLine.split("\t")[0];
    }
    
    // Fallback to the tag object hash if no dereferenced tag found
    const tagLine = lines.find((line) =>
      line.includes(`refs/tags/${tagName}`) && !line.includes("^{}")
    );

    if (!tagLine) {
      return void 0;
    }

    // Extract the tag object hash (for lightweight tags, this is the commit)
    return tagLine.split("\t")[0];
  }

  throw new Error(`[${result.code}]: ${gitCmd}`, {
    cause: result.code
  });
}

function* getContent(
  remote: string,
  ref: string,
  path: string,
): Operation<string> {
  const command = `git show ${remote}/${ref}:${path}`;
  const process = yield* useProcess(command);

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
    throw new Error(`[${result.code}] ${command}`, {
      cause: errorOutput,
    });
  }
}

/**
 * Create a Git-based repository instance
 * @param params - Repository owner and name
 * @returns Repository instance using Git commands
 */
export function* createGitRepository({
  owner,
  name,
}: UseRepositoryParams): Operation<Repository> {
  const nameWithOwner = `${owner}/${name}`;
  const url = `git@github.com:${nameWithOwner}.git`;

  // Ensure remote exists and is fetched
  if (!(yield* checkRemoteExists(nameWithOwner))) {
    yield* addRemote(nameWithOwner, url);
    yield* fetchRemote(nameWithOwner);
  }

  const repository: Repository = {
    nameWithOwner,
    owner,
    name,

    getDefaultBranch() {
      return getDefaultBranch(nameWithOwner);
    },

    getStarCount() {
      return getStarCount(nameWithOwner);
    },

    tags(ref: string) {
      return getMatchingTags(nameWithOwner, `${ref}*`);
    },

    *getContent(path: string) {
      const defaultBranch = yield* getDefaultBranch(nameWithOwner);
      return yield* getContent(nameWithOwner, defaultBranch, path);
    },

    loadRef(ref?: string) {
      return createGitRepositoryRef({ repository, ref });
    },
  };

  return repository;
}

/**
 * Create a Git-based repository reference instance
 * @param params - Repository and reference
 * @returns RepositoryRef instance using Git commands
 */
export function* createGitRepositoryRef({
  repository,
  ref: _ref,
}: {
  repository: Repository;
  ref?: string;
}): Operation<RepositoryRef> {
  // Default to main branch if no ref provided
  if (!_ref) {
    const default_branch = yield* getDefaultBranch(repository.nameWithOwner);
    _ref = `heads/${default_branch}`;
  }

  // Parse and normalize the ref
  const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;
  const parts = _ref.match(REF_PATTERN);
  let normalizedRef: string;
  if (parts) {
    normalizedRef = parts[0];
  } else {
    throw new Error(
      `Expected ref in format heads/<ref> or tags/<ref> (refs/ is ignored) but got ${_ref}`,
    );
  }

  const ref = matchRef(normalizedRef);
  if (!ref) throw new Error(`Could not normalize ${normalizedRef}`);

  const url = getRefUrl(repository, ref);

  const repositoryRef: RepositoryRef = {
    repository,
    ...ref,
    url,

    getUrl(base, target, isFile) {
      return new URL(
        [isFile ? "blob" : "tree", ref.name, getPath(base ?? "", target ?? "")]
          .filter(Boolean)
          .join("/"),
        `https://github.com/${repository.nameWithOwner}/`,
      );
    },

    getContent(path: string) {
      return getContent(repository.nameWithOwner, _ref!, path);
    },
  };

  return repositoryRef;
}
