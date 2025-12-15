import { createContext, Operation, until, useScope } from "effection";
import { Octokit } from "octokit";
import { operations } from "../context/fetch.ts";

const OctokitContext = createContext<Octokit>("github-client");

export function* initOctokitContext() {
  const token = Deno.env.get("GITHUB_TOKEN");

  const scope = yield* useScope();

  const octokit = new Octokit({
    auth: token,
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
  const github = yield* OctokitContext.expect();
  const [owner, name] = nameWithOwner.split("/");
  const response = yield* until(
    github.rest.repos.get({
      repo: name,
      owner: owner,
    }),
  );
  return response.data.stargazers_count;
}
