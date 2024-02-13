import { Octokit } from "npm:octokit@2.0.22";
import { createTokenAuth } from "npm:@octokit/auth-token";
import { assert } from "../../lib/deps.js";
import { call, createContext, resource, Operation } from "../../mod.js";

const GithubContext = createContext<Octokit>("octokit");

export function* setupGithub() {
  const octokit = yield* resource<Octokit>(function* (provide) {
    const token = Deno.env.get("GITHUB_TOKEN");

    assert(token, "GITHUB_TOKEN environment variable is missing");

    provide(
      new Octokit({
        auth: createTokenAuth(token),
      }),
    );
  });

  yield* GithubContext.set(octokit);
}

export function* useGithub() {
  return yield* GithubContext;
}

export function* getEffectionReleaseTags(): Operation<string[]> {
  const octokit = yield* useGithub();

  return yield* call(() =>
    octokit.paginate(
      "GET /repos/{owner}/{repo}/tags",
      {
        owner: "thefrontside",
        repo: "effection",
      },
      (response) =>
        response.data
          .filter(({ name }) =>
            /^effection-v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(name),
          )
          .map(({ name }) => name),
    ),
  );
}

export function* createEffectionRelease({
  name,
  tag_name,
  body,
}: {
  tag_name: string;
  name?: string | undefined;
  body?: string | undefined;
}) {
  const octokit = yield* useGithub();

  return yield* call(() =>
    octokit.request("POST /repos/{owner}/{repo}/releases", {
      owner: "thefrontside",
      repo: "effection",
      target_commitish: "master",
      name,
      tag_name,
      body,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }),
  );
}
