import { call, type Operation, until } from "effection";

import { GithubClientContext } from "../context/github.ts";
import {
  loadRepositoryRef,
  REF_PATTERN,
  RepositoryRef,
} from "./repository-ref.ts";

import { extractVersion, rsort } from "../lib/semver.ts";

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
export function extractSemverVersions(
  tags: { name: string }[],
): string[] {
  return rsort(tags.map((tag) => tag.name).map(extractVersion));
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
  tags(searchQuery?: string): Operation<{ name: string }[]>;



  /**
   * Get contents of a repository
   */
  getContent(path: string, ref?: string): Operation<string>;

  loadRef(ref?: string): Operation<RepositoryRef>;
}

export function* loadRepository({
  owner,
  name,
}: {
  owner: string;
  name: string;
}) {
  const github = yield* GithubClientContext.expect();

  const repository: Repository = {
    nameWithOwner: `${owner}/${name}`,
    owner,
    name,

    *getDefaultBranch() {
      const response = yield* until(
        github.rest.repos.get({
          repo: name,
          owner: owner,
        }),
      );
      return response.data.default_branch;
    },

    *getStarCount() {
      const response = yield* until(
        github.rest.repos.get({
          repo: name,
          owner: owner,
        }),
      );
      return response.data.stargazers_count;
    },

    *tags(searchQuery: string) {
      const result = yield* call(() =>
        github.graphql<{
          repository: { refs: { nodes: { name: string }[] } };
        }>(
          /* GraphQL */ `
            query RepositoryTags(
              $owner: String!
              $name: String!
              $searchQuery: String!
            ) {
              repository(owner: $owner, name: $name) {
                refs(query: $searchQuery, refPrefix: "refs/tags/", first: 100) {
                  nodes {
                    name
                  }
                }
              }
            }
          `,
          {
            name: name,
            owner: owner,
            searchQuery,
          },
        ),
      );

      return result.repository.refs.nodes;
    },
    *getContent(path, ref) {
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
    },
    *loadRef(ref?: string): Operation<RepositoryRef> {
      if (!ref) {
        const default_branch = yield* this.getDefaultBranch();
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
      return loadRepositoryRef({ ref, repository });
    },
  };

  return repository;
}
