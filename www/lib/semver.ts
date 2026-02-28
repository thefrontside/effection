export { compare, gt, major, maxSatisfying, minor, rsort } from "semver";

import { maxSatisfying, rsort } from "semver";

export function extractVersion(input: string) {
  let parts = input.match(
    // @source: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
    /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/,
  );
  if (parts) {
    return parts[0];
  } else {
    return "0.0.0";
  }
}

export interface FindLatestSemverTagOptions {
  includePrerelease?: boolean;
}

/**
 * Find the latest Semver tag from an array of tags
 * @param tags - Array of tag objects with name property
 * @param range - Optional semver range to filter tags (e.g., "4.x", ">=3.0.0")
 * @param options - Optional settings like includePrerelease
 * @returns Latest semver tag if found, undefined otherwise
 */
export function findLatestSemverTag<T extends { name: string }>(
  tags: T[],
  range?: string,
  options?: FindLatestSemverTagOptions,
): T | undefined {
  let versions = tags.map((tag) => tag.name).map(extractVersion);

  let latest: string | undefined;
  if (range) {
    // Use semver range matching (excludes prereleases by default)
    latest = maxSatisfying(versions, range, options) ?? undefined;
  } else {
    // Fallback to current behavior: sort all and take first
    [latest] = rsort(versions);
  }

  if (!latest) return undefined;
  return tags.find((tag) => tag.name.endsWith(latest));
}
