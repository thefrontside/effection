import { type Operation, until } from "effection";
import { OctokitContext } from "./octokit-context.ts";
import type {
  Repository,
  RepositoryRef,
  UseRepositoryParams,
} from "./types.ts";
import { getPath, getRefUrl, matchRef } from "./utils.ts";

/**
 * Get default branch for a repository using Octokit
 */
function* getDefaultBranch(nameWithOwner: string): Operation<string> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split("/");
  const response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.default_branch;
}

/**
 * Get star count for a repository using Octokit
 */
export function* getStarCount(nameWithOwner: string): Operation<number> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split("/");
  const response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.stargazers_count;
}

/**
 * Get tags for a repository matching a pattern using Octokit
 */
function* getMatchingTags(
  nameWithOwner: string,
  pattern?: string,
): Operation<{ name: string }[]> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split("/");
  const result = yield* until(
    github.rest.git.listMatchingRefs({
      owner,
      repo: name,
      ref: `tags/${pattern}`,
    }),
  );

  return result.data.map((ref) => ({ name: ref.ref }));
}

/**
 * Get content of a file from repository using Octokit
 */
function* getContent(
  nameWithOwner: string,
  ref: string,
  path: string,
): Operation<string> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split("/");
  const response = yield* until(
    github.rest.repos.getContent({
      repo: name,
      owner: owner,
      path,
      ref,
      mediaType: {
        format: "raw",
      },
    }),
  );

  return response.data.toString();
}

/**
 * Create an Octokit-based repository instance
 * @param params - Repository owner and name
 * @returns Repository instance using Octokit
 */
export function* createOctokitRepository({
  owner,
  name,
}: UseRepositoryParams): Operation<Repository> {
  const nameWithOwner = `${owner}/${name}`;

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
      return createOctokitRepositoryRef({ repository, ref });
    },
  };

  return repository;
}

/**
 * Create an Octokit-based repository reference instance
 * @param params - Repository and reference
 * @returns RepositoryRef instance using Octokit
 */
export function* createOctokitRepositoryRef({
  repository,
  ref: _ref,
}: {
  repository: Repository;
  ref?: string;
}): Operation<RepositoryRef> {
  const github = yield* OctokitContext.expect();

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

    *getContent(path: string) {
      const response = yield* until(
        github.rest.repos.getContent({
          repo: repository.name,
          owner: repository.owner,
          path,
          ref: ref.name,
          mediaType: {
            format: "raw",
          },
        }),
      );

      return response.data.toString();
    },
  };

  return repositoryRef;
}
