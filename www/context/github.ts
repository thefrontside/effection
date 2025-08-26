import { createContext, useScope } from "effection";

import { Octokit } from "npm:octokit@4.0.3";

import { operations } from "./fetch.ts";
import { urlRewriteApi } from "./url-rewrite.ts";

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({ token }: { token: string }) {
  const scope = yield* useScope();

  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: (url: string, init?: RequestInit) =>
        scope.run(() => operations.fetch(url, init)),
    },
  });

  return yield* GithubClientContext.set(octokit);
}

const GITHUB_CONTENTS_URL =
  /^https:\/\/api\.github\.com\/repos\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/contents\/(?<path>[^?]+)(?:\?(?<ref>.*))?$/;

const GITHUB_GIT_URL =
  /^git:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/?#]+)(?<ref>\?[^#]*)?#(?<path>.+)$/;

const GITHUB_BLOB_URL =
  /^https:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/blob\/(?<ref>[^/]+)\/(?<path>.*)$/;

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

/**
 * Predicate function that determines if a GitHub Contents API URL should be rewritten.
 * @param parts - The parsed components of the GitHub API URL
 * @param parts.owner - The repository owner/organization name
 * @param parts.repo - The repository name
 * @param parts.path - The file/directory path within the repository
 * @param parts.ref - The git reference (branch, tag, or commit hash)
 * @returns true if the URL should be rewritten to git:// protocol, false otherwise
 */
interface ShouldRewrite {
  (parts: { owner: string; repo: string; path: string; ref: string }): boolean;
}

/**
 * Rewrites GitHub Contents API URLs to git:// protocol URLs.
 *
 * @param shouldRewrite - See {@link ShouldRewrite} interface for details.
 *
 * Transforms URLs from:
 *   https://api.github.com/repos/thefrontside/effection/contents/docs%2Finstallation.md?ref=v3
 * To:
 *   git://github.com/thefrontside/effection?ref=v3#src%2Fdocs%2Finstallation.md
 */
export function* rewriteContentsApiToGit(shouldRewrite: ShouldRewrite) {
  yield* urlRewriteApi.around({
    *rewrite([url, input, init], next) {
      const match = GITHUB_CONTENTS_URL.exec(String(url)) ||
        GITHUB_BLOB_URL.exec(String(url));

      if (!match?.groups) {
        return yield* next(url, input, init);
      }

      const { owner, repo, path, ref = "" } = match.groups;

      const cleanRef = ref.replace("ref=", "");

      if (
        shouldRewrite({
          owner,
          repo,
          path: decodeURIComponent(path),
          ref: decodeURIComponent(cleanRef),
        })
      ) {
        const searchParam = cleanRef ? `?ref=${cleanRef}` : "";
        return yield* next(
          new URL(`git://github.com/${owner}/${repo}${searchParam}#${path}`),
          input,
          init,
        );
      }

      return yield* next(url, input, init);
    },
  });
}

/**
 * Rewrites git:// protocol URLs to file:// URLs based on a local base path.
 *
 * This function intercepts requests to git:// URLs, parses them using parseGitUrl,
 * and redirects them to local file paths relative to the provided base URL.
 *
 * @param base - The base file:// URL to resolve relative file paths against (must start with 'file:/' and end with '/')
 * @yields A URL rewrite middleware that transforms git:// URLs to local file URLs
 * @throws {Error} When base doesn't start with 'file:/' or doesn't end with '/'
 *
 * @example
 * ```typescript
 * yield* rewriteGitToFile("file:///path/to/local/repo/");
 * // git://github.com/owner/repo#src/file.ts → file:///path/to/local/repo/src/file.ts
 * ```
 */
export function* rewriteGitToFile(base: string) {
  if (!base.startsWith("file:/")) {
    throw new Error(`Base URL must start with 'file:/' but got: ${base}`);
  }
  if (!base.endsWith("/")) {
    throw new Error(`Base URL must end with '/' but got: ${base}`);
  }

  yield* urlRewriteApi.around({
    *rewrite([url, input, init], next) {
      if (url.protocol === "git:") {
        const parsed = parseGitUrl(String(url));
        if (parsed) {
          const fileUrl = new URL(`./${parsed.path}`, base);
          console.log(`Rewrote ${url} ➡️ ${fileUrl}`);
          return yield* next(fileUrl, input, init);
        }
      }
      return yield* next(url, input, init);
    },
  });
}
