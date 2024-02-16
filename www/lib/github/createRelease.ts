import { call } from "effection";
import { useGithub } from "./useGithub.ts";
import type { Endpoints } from 'npm:@octokit/types';

export function* createRelease(params: Endpoints["POST /repos/{owner}/{repo}/releases"]['parameters']) {
  const octokit = yield* useGithub();

  return yield* call(() => octokit.request("POST /repos/{owner}/{repo}/releases", params));
}
