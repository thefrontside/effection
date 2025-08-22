import { Operation, until } from 'effection';
import { createApi, type Around } from "./context-api.ts";
import GitUrlParse from "git-url-parse";

interface UrlReader {
  readUrl(url: URL, options: Record<string, unknown>): Operation<Response> 
}

export const urlReaderApi = createApi<UrlReader>("url-reader", {
  readUrl(url, options) {
    return until(fetch(url, options))
  }
});

export const { readUrl } = urlReaderApi.operations;

export const fileReader: Around<UrlReader> = {
  *readUrl([url, options], next) {
    if (url.protocol === "file:") {
      const file = yield* until(Deno.readTextFile(url))
      return new Response(file);
    } else {
      return yield* next(url, options);
    }
  }
}

function* setupFileRewriteMiddleware() {
  const EFFECTION_REPO = Deno.env.get("EFFECTION_REPO");
  if (EFFECTION_REPO) {
    console.log(`💪 Using ${EFFECTION_REPO} via file rewrite middleware.`);
    yield* urlReaderApi.around({
      *readUrl([url, options], next) {
        const ghUrl = GitUrlParse(url.toString());
        if (ghUrl.resource === "github.com" && ghUrl.owner === "thefrontside" && ghUrl.name === "effection") {
          const newUrl = new URL(ghUrl.filepathtype, EFFECTION_REPO);
          console.log(`Rewrote ${url} ➡️ ${newUrl}`);
          return yield* next(newUrl, options);
        } else {
          console.log(`Ignoring ${url}`);
          return yield* next(url, options);
        }
      }
    })
  }
}

export function* setupUrlReader() {
  yield* setupFileRewriteMiddleware();
  yield* urlReaderApi.around(fileReader);

}

// import { endpoint } from "npm:@octokit/endpoint@10.1.2";
// import { md5 } from "jsr:@takker/md5@0.1.0";
// import { encodeHex } from "jsr:@std/encoding@1";
// const key = generateKey(options);

// if (cache.has(key)) {
//   console.log(`🎯 Cache hit: ${key}`);
//   return cache.get(key) as OctokitResponse<unknown, number>;
// } else {
//   console.log(`🙅‍♂️ Cache miss: ${key}`);
//   const response = await request(options);
//   cache.set(key, response);
// }

// return cache.get(key) as OctokitResponse<unknown, number>;

// function generateKey(options: Required<EndpointDefaults>) {
//   const params: ParseResult = endpoint.parse(options);

//   switch (params.method) {
//     case "GET":
//       return params.url;
//     case "POST":
//       return `${encodeHex(md5(params.body.query))}-${
//         Object.keys(params.body.variables)
//           .map((p) => `${p}:${params.body.variables[p]}`)
//           .join("-")
//       }`;
//     default:
//       throw new Error("unimplemented");
//   }
// }