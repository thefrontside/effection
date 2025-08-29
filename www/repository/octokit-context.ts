import { createContext, useScope } from "effection";
import { Octokit } from "npm:octokit@4.0.3";
import { operations } from "../context/fetch.ts";

export const OctokitContext = createContext<Octokit>("github-client");

export function* initOctokitContext() {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    throw new Error(`GITHUB_TOKEN environment variable is missing`);
  }

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