import { type Operation } from "effection";
import { extractVersion, rsort } from "../lib/semver.ts";
import type { ContentProvider, RefTypeInfo, Repository } from "./types.ts";

/**
 * GitHub URL patterns for parsing different URL formats
 */
export const GITHUB_CONTENTS_URL =
  /^https:\/\/api\.github\.com\/repos\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/contents\/(?<path>[^?]+)(?:\?(?<ref>.*))?$/;

export const GITHUB_GIT_URL =
  /^git:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/?#]+)(?<ref>\?[^#]*)?#(?<path>.+)$/;

export const GITHUB_BLOB_URL =
  /^https:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/blob\/(?<ref>(?:refs\/(?:heads\/|tags\/)?)?[^/]+)\/(?<path>.*)$/;

/**
 * Return relative path that can be used to retrieve file content
 * @param base - Base path
 * @param target - Target path
 * @returns Combined path with leading "./" removed
 */
export function getPath(base: string, target: string): string {
  return [base, target].filter(Boolean).join("/").replace(/^\.\//, "");
}

/**
 * Parse and normalize a Git reference string
 * @param ref - Reference string (e.g., "heads/main", "refs/tags/v1.0.0", "main")
 * @returns Normalized RefTypeInfo object, or undefined if invalid
 */
export function matchRef(ref: string): RefTypeInfo | undefined {
  const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;
  const parts = ref.match(REF_PATTERN);
  if (parts) {
    const [, , group, name] = parts;
    if (group === "heads") {
      return {
        type: "branch",
        name,
        ref: `${group}/${name}`,
        normalized: `refs/${group}/${name}`,
      };
    } else if (group === "tags") {
      return {
        type: "tag",
        name,
        ref: `${group}/${name}`,
        normalized: `refs/${group}/${name}`,
      };
    }
  }
}

/**
 * Generate GitHub web URL for a repository reference
 * @param repository - Repository object
 * @param ref - Git reference (branch or tag)
 * @returns GitHub tree URL for the reference
 */
export function getRefUrl(repository: Repository, ref: RefTypeInfo): string {
  return `https://github.com/${repository.owner}/${repository.name}/tree/${ref.name}/`;
}

/**
 * Load and parse JSON file from a content provider
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
 * Load README.md file from a content provider at a base path
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

/**
 * Find the latest Semver tag from an array of tags
 * @param tags - Array of tag objects with name property
 * @returns Latest semver tag if found, undefined otherwise
 */
export function findLatestSemverTag(
  tags: { name: string }[],
): { name: string } | undefined {
  const [latest] = rsort(tags.map((tag) => tag.name).map(extractVersion));
  return tags.find((tag) => tag.name.endsWith(latest));
}

/**
 * Extract and sort semver versions from an array of tags
 * @param tags - Array of tag objects with name property
 * @returns Sorted array of version strings (highest first)
 */
export function extractSemverVersions(tags: { name: string }[]): string[] {
  return rsort(tags.map((tag) => tag.name).map(extractVersion));
}

/**
 * Parses a git:// URL and returns the decoded components.
 * @param url - The git:// URL to parse (e.g., "git://github.com/owner/repo?ref=main#path%2Fto%2Ffile.js")
 * @returns Parsed and decoded URL parts, or null if URL doesn't match format
 */
export function parseGitUrl(url: string): {
  owner: string;
  repo: string;
  path: string;
  ref: string;
} | null {
  const match = GITHUB_GIT_URL.exec(url);

  if (!match?.groups) {
    return null;
  }

  const { owner, repo, ref = "", path } = match.groups;
  const cleanRef = ref.replace("?ref=", "");

  return {
    owner,
    repo,
    path: decodeURIComponent(path),
    ref: decodeURIComponent(cleanRef),
  };
}

/**
 * Parses a GitHub blob URL and returns the decoded components.
 * @param url - The GitHub blob URL to parse (e.g., "https://github.com/thefrontside/effectionx/blob/main/context-api/deno.json")
 * @returns Parsed URL parts, or null if URL doesn't match format
 */
export function parseGithubUrl(url: string): {
  owner: string;
  repo: string;
  ref: string;
  path: string;
} | null {
  const match = GITHUB_BLOB_URL.exec(url);

  if (!match?.groups) {
    return null;
  }

  const { owner, repo, ref, path } = match.groups;

  return {
    owner,
    repo,
    ref,
    path,
  };
}
