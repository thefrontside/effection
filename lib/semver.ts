// @deno-types="npm:@types/semver@7.5.8"
export { minor, major, rsort, compare } from "npm:semver@7.6.3";

export function extractVersion(input: string) {
  const parts = input.match(
    // @source: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
    /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/,
  );
  if (parts) {
    return parts[0];
  } else {
    return input;
  }
}