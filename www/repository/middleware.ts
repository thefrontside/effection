import { fetchApi } from "../context/fetch.ts";
import { log } from "../context/logging.ts";
import { urlRewriteApi } from "../context/url-rewrite.ts";
import { useRef, useRepository } from "./api.ts";
import { determineRefType } from "./git-provider.ts";
import { GITHUB_BLOB_URL, GITHUB_CONTENTS_URL, parseGitUrl } from "./utils.ts";

/**
 * Initialize GitHub blob fetch middleware
 * Intercepts GitHub blob URLs and fetches content via repository API
 */
export function* initGithubBlobFetchMiddleware() {
  // Override fetch to handle GitHub blob URLs
  yield* fetchApi.around({
    *fetch([input, init], next) {
      if (typeof input === "string" && !init) {
        const match = GITHUB_BLOB_URL.exec(input);

        if (match?.groups) {
          const { owner, repo, ref: rawRef, path } = match.groups;

          // Use repository API instead of direct Octokit calls
          const repository = yield* useRepository({
            owner: owner,
            name: repo,
          });

          const ref = yield* determineRefType(
            `${repository.owner}/${repository.name}`,
            rawRef,
          );

          const repositoryRef = yield* useRef({
            repository,
            ref: ref.normalized,
          });

          const content = yield* repositoryRef.getContent(path);

          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
            },
          });
        }
      }
      return yield* next(input, init);
    },
  });
}

/**
 * Predicate function that determines if a GitHub Contents API URL should be rewritten.
 */
export interface ShouldRewrite {
  (parts: { owner: string; repo: string; path: string; ref: string }): boolean;
}

/**
 * Rewrites GitHub Contents API URLs to git:// protocol URLs.
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
          yield* log.debug(`Rewrote ${url} ➡️ ${fileUrl}`);
          return yield* next(fileUrl, input, init);
        }
      }
      return yield* next(url, input, init);
    },
  });
}
