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
export function* fetchRemote(
  remote: string,
  tags?: boolean | undefined,
): Operation<void> {
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
    const command = `git ls-remote --tags ${remote}${
      pattern ? ` "${pattern}"` : ""
    }`;
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

  const lines = result.stdout.split("\n").filter((line) => line.length > 0);

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

/**
 * Get file content from a git remote at a specific reference
 * @param remote - The git remote name (e.g., "origin", "upstream")
 * @param ref - The git reference to fetch content from. Can be:
 *   - Branch name: "main", "develop", "feature-branch"
 *   - Tag name: "v1.0.0", "release-2.1"
 *   - Commit hash: "abc123def456"
 *   - Full ref: "refs/heads/main", "refs/tags/v1.0.0"
 * @param path - The file path within the repository
 * @returns The file content as a string
 * 
 * @example
 * ```typescript
 * // Get content from a branch
 * const content = yield* getContent("origin", "main", "README.md");
 * 
 * // Get content from a tag
 * const content = yield* getContent("origin", "v1.0.0", "package.json");
 * 
 * // Get content from a commit
 * const content = yield* getContent("origin", "abc123", "src/index.ts");
 * ```
 */
export function* getContent(
  remote: string,
  ref: string,
  path: string,
): Operation<string> {
  let actualRef = ref;
  
  // Handle different ref formats
  if (ref.startsWith("refs/tags/")) {
    // Full tag ref format: refs/tags/v1.0.0
    const tagName = ref.substring(10); // Remove "refs/tags/" prefix
    const commitHash = yield* lookupTagCommit({
      remoteName: remote,
      tagName: tagName,
    });
    if (commitHash) {
      actualRef = commitHash;
    } else {
      throw new Error(`Tag ${tagName} not found in remote ${remote}`);
    }
  } else if (ref.startsWith("refs/heads/")) {
    // Full branch ref format: refs/heads/main
    const branchName = ref.substring(11); // Remove "refs/heads/" prefix
    actualRef = `${remote}/${branchName}`;
  } else if (ref.startsWith("refs/")) {
    // Other refs/ format - use as is with remote prefix
    actualRef = `${remote}/${ref}`;
  } else if (ref.startsWith("tags/")) {
    // tags/ prefix: extract tag name and lookup commit hash
    const tagName = ref.substring(5); // Remove "tags/" prefix
    const commitHash = yield* lookupTagCommit({
      remoteName: remote,
      tagName: tagName,
    });
    if (commitHash) {
      actualRef = commitHash;
    } else {
      throw new Error(`Tag ${tagName} not found in remote ${remote}`);
    }
  } else if (ref.startsWith("heads/")) {
    // heads/ prefix: extract branch name and use remote/branch format
    const branchName = ref.substring(6); // Remove "heads/" prefix
    actualRef = `${remote}/${branchName}`;
  } else if (!ref.includes("/")) {
    // Simple ref name: could be tag or branch
    // Try to resolve as tag first
    const commitHash = yield* lookupTagCommit({
      remoteName: remote,
      tagName: ref,
    });
    if (commitHash) {
      actualRef = commitHash;
    } else {
      // Fallback to using as branch reference
      actualRef = `${remote}/${ref}`;
    }
  } else {
    // Already formatted as remote/branch or other format
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
  repository,
}: UseRepositoryParams): Operation<Repository> {
  const nameWithOwner = `${owner}/${name}`;
  const url = repository ?? `git@github.com:${nameWithOwner}.git`;

  // Ensure remote exists and is fetched
  if (!(yield* checkRemoteExists(nameWithOwner))) {
    yield* addRemote(nameWithOwner, url);
    yield* fetchRemote(nameWithOwner);
  }

  return {
    nameWithOwner,
    owner,
    name,
    getDefaultBranch: () => getDefaultBranch(nameWithOwner),
    getStarCount: () => getStarCount(nameWithOwner),
    tags: (ref: string) => getMatchingTags(nameWithOwner, `${ref}*`),
    *getContent(path: string) {
      const defaultBranch = yield* getDefaultBranch(nameWithOwner);
      return yield* getContent(nameWithOwner, defaultBranch, path);
    },
    loadRef(ref?: string) {
      return createGitRepositoryRef({ repository: this, ref });
    },
  };
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

    getContent: (path: string) =>
      getContent(repository.nameWithOwner, _ref!, path),
  };

  return repositoryRef;
}
