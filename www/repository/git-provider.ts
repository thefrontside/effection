import { Operation } from "effection";
import { $ } from "../context/shell.ts";
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
export function* checkRemoteExists(remoteName: string): Operation<boolean> {
  try {
    yield* $(`git remote get-url ${remoteName}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a git remote
 */
export function* addRemote(remote: string, url: string): Operation<void> {
  yield* $(`git remote add ${remote} ${url}`);
}

/**
 * Fetch from a git remote
 */
export function* fetchRemote(remote: string, tags?: boolean | undefined): Operation<void> {
  yield* $(`git fetch ${remote}${tags ? " --tags" : ""}`);
}

/**
 * Get default branch for a repository using git commands
 */
export function* getDefaultBranch(remote: string): Operation<string> {
  const result = yield* $(`git ls-remote --symref ${remote} HEAD`);

  // Output looks like: "ref: refs/heads/main    HEAD"
  const match = result.stdout.match(/^ref: refs\/heads\/(.+?)\s+HEAD/m);
  if (match) {
    return match[1];
  }

  throw new Error(`Failed to get default branch`);
}

/**
 * Get tags for a repository matching a pattern using git commands
 */
export function* getMatchingTags(
  remote: string,
  pattern?: string,
): Operation<{ name: string }[]> {
  try {
    const command = `git ls-remote --tags ${remote}${pattern ? ` "${pattern}"` : ''}`;
    const result = yield* $(command);

    // Parse output: "hash    refs/tags/tagname"
    return result.stdout
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const match = line.match(/refs\/tags\/(.+?)(\^\{\})?$/);
        return match ? match[1] : null;
      })
      .filter((tag): tag is string => tag !== null)
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .map((name) => ({ name })); // Remove duplicates
  } catch {
    return [];
  }
}

/**
 * Get commit hash for a tag from a remote repository
 */
export function* lookupTagCommit({ remoteName, tagName }: {
  remoteName: string;
  tagName: string;
}): Operation<string | undefined> {
  const result = yield* $(`git ls-remote --tags ${remoteName}`);

  const lines = result.stdout.split("\n").filter((line) =>
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

export function* getContent(
  remote: string,
  ref: string,
  path: string,
): Operation<string> {
  // If ref looks like a tag (not branch), try to lookup commit hash
  let actualRef = ref;
  if (!ref.startsWith("refs/") && !ref.includes("/")) {
    // Try to resolve as tag first
    const commitHash = yield* lookupTagCommit({ 
      remoteName: remote, 
      tagName: ref 
    });
    if (commitHash) {
      actualRef = commitHash;
    } else {
      // Fallback to using as branch reference
      actualRef = `${remote}/${ref}`;
    }
  } else {
    actualRef = `${remote}/${ref}`;
  }
  
  const result = yield* $(`git show ${actualRef}:${path}`);
  return result.stdout;
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
