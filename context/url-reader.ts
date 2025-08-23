import { Operation, until } from "effection";
import { createApi, type Around } from "./context-api.ts";
import { join } from "node:path";

interface UrlReader {
  readUrl(url: URL, options: Record<string, unknown>): Operation<Response>;
}

export const urlReaderApi = createApi<UrlReader>("url-reader", {
  readUrl(url, options) {
    return until(fetch(url, options));
  },
});

export const { readUrl } = urlReaderApi.operations;

export const fileReader: Around<UrlReader> = {
  *readUrl([url, options], next) {
    if (url.protocol === "file:") {
      const file = yield* until(Deno.readTextFile(url));
      return new Response(file);
    } else {
      return yield* next(url, options);
    }
  },
};

const basePath = '/repos/thefrontside/effection/contents/';

function* setupFileRewriteMiddleware() {
  const EFFECTION_REPO = Deno.env.get("EFFECTION_REPO");
  if (EFFECTION_REPO) {
    console.log(`💪 Using ${EFFECTION_REPO} via file rewrite middleware.`);
    yield* urlReaderApi.around({
      *readUrl([url, options], next) {
        
        if (url.hostname === "api.github.com" && url.pathname.startsWith(basePath)) {
          const pathToContent = decodeURIComponent(url.pathname.replace(basePath, ""));
          const newPath = join(EFFECTION_REPO, pathToContent)
          console.log(`➡️ Redirecting to ${newPath}`)
           try {
            const file = yield* until(Deno.open(newPath));
            return new Response(file.readable);
          } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
              return new Response(`File not found ${newPath}`, { status: 404 });
            }
            console.error(`Error reading file ${newPath}:`, error);
            return new Response("Internal server error", { status: 500 });
          }
        }

        return yield* next(url, options);
      },
    });
  }
}

export function* setupUrlReader() {
  yield* setupFileRewriteMiddleware();
  yield* urlReaderApi.around(fileReader);
}