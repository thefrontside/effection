import { Octokit } from "npm:octokit@2.0.22";
import { createTokenAuth } from "npm:@octokit/auth-token";
import { assert } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { call, createContext, Operation } from "effection";
import { useEnv } from "../useEnv.ts";

const GithubContext = createContext<Octokit>("octokit");

export function* withGithub<T>(op: () => Operation<T>) {
  return call(function* () {
    yield* initGithub();
    return yield* op();
  });
}

export function* initGithub() {
  const env = yield* useEnv();

  const token = env.get("GITHUB_TOKEN");
  assert(token, "GITHUB_TOKEN environment variable is missing");

  const octokit = new Octokit({
    auth: createTokenAuth(token),
  });

  yield* GithubContext.set(octokit);
}

export function* useGithub() {
  return yield* GithubContext;
}

