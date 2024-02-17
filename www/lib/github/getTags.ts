import { call } from "effection";
import { useGithub } from "./useGithub.ts";
import type { Endpoints } from "npm:@octokit/types";

export function* getTags(
  params: Endpoints["GET /repos/{owner}/{repo}/tags"]["parameters"],
) {
  const github = yield* useGithub();

  return (
    yield* call(() => github.paginate("GET /repos/{owner}/{repo}/tags", params))
  );
}
