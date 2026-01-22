export { compare, major, minor, rsort } from "semver";

import { rsort } from "semver";

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

/**
 * Find the latest Semver tag from an array of tags
 * @param tags - Array of tag objects with name property
 * @returns Latest semver tag if found, undefined otherwise
 */
export function findLatestSemverTag<T extends { name: string }>(
  tags: T[],
): T | undefined {
  let [latest] = rsort(tags.map((tag) => tag.name).map(extractVersion));
  return tags.find((tag) => tag.name.endsWith(latest));
}
