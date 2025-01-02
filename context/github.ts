import { createContext } from "effection";
import type {
  EndpointInterface,
  OctokitResponse,
} from "npm:@octokit/types@13.6.2";
import { endpoint } from "npm:@octokit/endpoint@10.1.2";
import { Octokit } from "npm:octokit@^4.0.0";
import { md5 } from "jsr:@takker/md5@0.1.0";
import { encodeHex } from "jsr:@std/encoding@1";

import { CacheContext } from "./cache.ts";

type ParseResult = ReturnType<EndpointInterface<object>["parse"]>;

export const GithubClientContext = createContext<Octokit>("github-client");

export function* initGithubClientContext({ token }: { token: string }) {
  const cache = yield* CacheContext.expect();

  const octokit = new Octokit({ auth: token });

  octokit.hook.wrap("request", async (request, options) => {
    const key = generateKey(options);

    if (!cache.has(key)) {
      const response = await request(options);
      cache.set(key, response);
    }

    return cache.get(key) as OctokitResponse<unknown, number>;
  });

  return yield* GithubClientContext.set(octokit);
}

function generateKey(options: unknown) {
  const params: ParseResult = endpoint.parse(options);

  switch (params.method) {
    case "GET":
      return params.url;
    case "POST":
      return `${encodeHex(md5(params.body.query))}-${
        Object.keys(params.body.variables)
          .map((p) => `${p}:${params.body.variables[p]}`)
          .join("-")
      }`;
    default:
      throw new Error("unimplemented");
  }
}
