import { type Operation, until } from "effection";

import { OctokitContext } from "../context/github.ts";
import {
  getPath,
  loadRepositoryRef,
  REF_PATTERN,
  RepositoryRef,
} from "./repository-ref.ts";

import { extractVersion, rsort } from "../lib/semver.ts";

/**
 * Interface for objects that can provide file content
 */
export interface ContentProvider {
  /**
   * Get contents of a file at the specified path
   * @param path - Path to the file
   */
  getContent(path: string): Operation<string>;
}

/**
 * Find the latest Semver tag from an array of tags.
 *
 * @param tags - Array of tag objects with name property
 * @returns a tag if found or undefined
 */
export function findLatestSemverTag(
  tags: { name: string }[],
): { name: string } | undefined {
  const [latest] = rsort(tags.map((tag) => tag.name).map(extractVersion));

  return tags.find((tag) => tag.name.endsWith(latest));
}

/**
 * Extract and sort semver versions from an array of tags.
 *
 * @param tags - Array of tag objects with name property
 * @returns sorted array of version strings
 */
export function extractSemverVersions(tags: { name: string }[]): string[] {
  return rsort(tags.map((tag) => tag.name).map(extractVersion));
}

/**
 * Load and parse JSON file from a content provider.
 *
 * @param contentProvider - Object that can provide file content
 * @param path - Path to the JSON file
 * @returns Parsed JSON content
 */
export function* loadJson<T = unknown>(
  contentProvider: ContentProvider,
  path: string,
): Operation<T> {
  const text = yield* contentProvider.getContent(path);
  return JSON.parse(text) as T;
}

/**
 * Load README.md file from a content provider at a base path.
 *
 * @param contentProvider - Object that can provide file content
 * @param base - Base path within the repository (defaults to "")
 * @returns Content of README.md file
 */
export function* loadReadme(
  contentProvider: ContentProvider,
  base: string = "",
): Operation<string> {
  const path = getPath(base, "README.md");
  return yield* contentProvider.getContent(path);
}

export interface Repository {
  name: string;

  owner: string;

  nameWithOwner: string;

  getDefaultBranch(): Operation<string>;

  getStarCount(): Operation<number>;

  /**
   * Retrieve tags for the current repository.
   *
   * Optionally, filter tags using a glob. It should accept the same arguement as we use to trigger a push event.
   *
   * For example:
   *  - v*
   *  - v3*
   *  - effection-v3*
   *
   * Should are valid glob patterns
   *
   * @returns tag objects
   */
  tags(ref?: string): Operation<{ name: string }[]>;

  /**
   * Get contents of a repository on main branch.
   * To read content on other branches, use loadRef to create
   * a RepositoryRef instance with it's own getContent method.
   */
  getContent(path: string): Operation<string>;

  loadRef(ref?: string): Operation<RepositoryRef>;
}

/**
 * Get default branch for a repository
 */
function* getDefaultBranch(nameWithOwner: string): Operation<string> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split('/');
  const response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.default_branch;
}

/**
 * Get star count for a repository
 */
function* getStarCount(nameWithOwner: string): Operation<number> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split('/');
  const response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.stargazers_count;
}

/**
 * Get tags for a repository matching a pattern
 */
function* getMatchingTags(
  nameWithOwner: string,
  pattern?: string,
): Operation<{ name: string }[]> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split('/');
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
 * Get content of a file from repository
 */
function* getContent(
  nameWithOwner: string,
  ref: string,
  path: string,
): Operation<string> {
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split('/');
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
 * Load a repository reference
 */
function* loadRepositoryRefForRepository(
  repository: Repository,
  ref?: string,
): Operation<RepositoryRef> {
  if (!ref) {
    const default_branch = yield* getDefaultBranch(repository.nameWithOwner);
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

  return yield* loadRepositoryRef({ ref, repository });
}

export function* loadRepository({
  owner,
  name,
}: {
  owner: string;
  name: string;
}) {
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
      return loadRepositoryRefForRepository(repository, ref);
    },
  };

  return repository;
}
