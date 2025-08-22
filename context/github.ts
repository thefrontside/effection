import { createContext, until, useScope } from "effection";
import type {
  EndpointDefaults,
  EndpointInterface,
  OctokitResponse
} from "npm:@octokit/types@13.6.2";

import { Octokit } from "npm:octokit@4.0.3";

import { readUrl } from './url-reader.ts';

type ParseResult = ReturnType<EndpointInterface<object>["parse"]>;

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({ token }: { token: string }) {
  const scope = yield* useScope();
  const octokit = new Octokit({ auth: token });

  octokit.hook.wrap(
    "request",
    (request, options: Required<EndpointDefaults>) => {
      return scope.run<OctokitResponse<unknown, number>>(function*() {
        if (options.url.startsWith("https://")) {
          const response = yield* readUrl(new URL(options.url), options);
          return {
            headers: Object.fromEntries(response.headers),
            status: response.status,
            url: response.url,
            data: yield* until(response.text())
          } as OctokitResponse<unknown, number>
        }
        const result = yield* until(Promise.resolve(request(options)))
        return result;
      })
    },
  );

  return yield* GithubClientContext.set(octokit);
}


