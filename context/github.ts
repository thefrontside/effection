import { createContext } from "effection";
import { Octokit } from "npm:octokit@^4.0.0";

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({ token }: { token: string }) {
  return yield* GithubClientContext.set(new Octokit({ token }))
}