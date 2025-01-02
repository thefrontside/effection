import { createContext } from "effection";
import { endpoint } from "npm:@octokit/endpoint@10.1.2";
import { Octokit } from "npm:octokit@^4.0.0";
import { CacheContext } from "./cache.ts";

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({ token }: { token: string }) {
  const cache = yield* CacheContext.expect();

  const octokit = new Octokit({ token });

  octokit.hook.wrap("request", async (request, options) => {
    const params = endpoint.parse(options);
    
    if (!cache.has(params.url)) {
      const response = await request(options)
      cache.set(params.url, response);
    }

    return cache.get(params.url);
  });

  return yield* GithubClientContext.set(octokit)
}