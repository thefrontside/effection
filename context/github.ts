import { createContext, Scope } from "effection";
import type {
  EndpointInterface,
} from "npm:@octokit/types@13.6.2";

import { Octokit } from "npm:octokit@4.0.3";

import { readUrl } from "./url-reader.ts";

type ParseResult = ReturnType<EndpointInterface<object>["parse"]>;

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({
  token,
  scope,
}: {
  token: string;
  scope: Scope;
}) {
  const octokit = new Octokit({ 
    auth: token,
    request: {
      fetch: (url: string, options: Record<string, unknown>) => scope.run(function* () {
        return yield* readUrl(typeof url === "string" ? new URL(url) : url, options);
      })
    } 
  });

  return yield* GithubClientContext.set(octokit);
}
