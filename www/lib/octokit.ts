import { createContext, Operation, until, useScope } from "effection";
import { Octokit } from "octokit";
import { operations } from "../context/fetch.ts";

const OctokitContext = createContext<Octokit>("github-client");

export function* initOctokitContext(token: string) {
  let scope = yield* useScope();

  let octokit = new Octokit({
    // Octokit treats an empty string as a credential and sends it; `undefined`
    // is what makes it fall back to unauthenticated requests.
    auth: token === "" ? undefined : token,
    request: {
      fetch: (url: string, init?: RequestInit) => {
        return scope.run(() => operations.fetch(url, init));
      },
    },
  });

  return yield* OctokitContext.set(octokit);
}

/**
 * Get star count for a repository using Octokit
 */
export function* getStarCount(nameWithOwner: string): Operation<number> {
  let github = yield* OctokitContext.expect();
  let [owner, name] = nameWithOwner.split("/");
  let response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.stargazers_count;
}
