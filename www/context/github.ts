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
        scope.run(() => {
          console.log(`Octokit Fetch Adapter ${url}`, init)
          return operations.fetch(url, init);
        })
    },
  });

  return yield* GithubClientContext.set(octokit);
}

const GITHUB_CONTENTS_API =
  /^https:\/\/api\.github\.com\/repos\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/contents\/(?<path>[^?]+)(?:\?(?<query>.*))?$/;

const GIT_GITHUB_URL = 
  /^git:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/?#]+)(?<search>\?[^#]*)?#(?<path>.+)$/;

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
  const match = GIT_GITHUB_URL.exec(url);
  
  if (!match?.groups) {
    return null;
  }

  const { owner, repo, search = "", path } = match.groups;
  const ref = search.replace("?ref=", "");

  return {
    owner,
    repo,
    path: decodeURIComponent(path),
    ref: decodeURIComponent(ref),
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
      const match = GITHUB_CONTENTS_API.exec(String(url));

      if (!match?.groups) {
        return yield* next(url, input, init);
      }

      const {owner, repo, path, query = ""} = match?.groups;
      const ref = query.replace("ref=", "");
      
      if (
        shouldRewrite({
          owner,
          repo,
          path: decodeURIComponent(path),
          ref: decodeURIComponent(ref),
        })
      ) {
        const searchParam = query ? `?${query}` : "";
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
 * 
 * @param base 
 */
export function* rewriteGitToFile(base: string) {
  yield* urlRewriteApi.around({
    *rewrite([url, input, init], next) {
      if (url.protocol === 'git:') {
        const parsed = parseGitUrl(String(url));
        if (parsed) {
          const fileUrl = new URL(`./${parsed.path}`, base);
          console.log(`Rewrote ${url} ➡️ ${fileUrl}`);
          return yield* next(fileUrl, input, init);
        }
      }
      return yield* next(url, input, init);
    }
  })
}
