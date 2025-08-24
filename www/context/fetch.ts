import { Operation, until, useAbortSignal } from "effection";
import { createApi } from "./context-api.ts";
import { rewrite } from "./url-rewrite.ts";

interface FetchApi {
  fetch(input: RequestInfo | URL, init?: RequestInit): Operation<Response>;
}

export const fetchApi = createApi<FetchApi>("fetch", {
  *fetch(input, init) {
    return yield* until(globalThis.fetch(input, init));
  },
});

export const { operations } = fetchApi;

export function* initFetch() {
  const cache = yield* until(caches.open("local-cache"));

  yield* fetchApi.around({
    *fetch([input, init], next) {
      let request = input instanceof Request ? input : new Request(input, init);
      if (request.method === 'GET') {
        const response = yield* until(cache.match(request));
        if (response) {
          return response;
        } else {
          const response = yield* next(input, init);
          yield* until(cache.put(request, response.clone()));
          return response;
        }
      }
      return yield* next(input, init);
    },
  });

  yield* fetchApi.around({
    *fetch([input, init], next) {
      const url =
        input instanceof Request ? new URL(input.url) : new URL(input);

      if (url.protocol === "file:") {
        console.log(`Reading file system file from ${url}`);
        try {
          const file = yield* until(Deno.open(url.pathname));
          return new Response(file.readable);
        } catch (error) {
          if (error instanceof Deno.errors.NotFound) {
            return new Response(`File not found ${url.pathname}`, {
              status: 404,
            });
          }
          console.error(`Error reading file ${url.pathname}:`, error);
          return new Response("Internal server error", { status: 500 });
        }
      } else {
        return yield* next(input, init);
      }
    },
  });

  yield* fetchApi.around({
    *fetch([input, init], next) {
      const url =
        input instanceof Request ? new URL(input.url) : new URL(input);
      const newUrl = yield* rewrite(url, input, init);
      if (url !== newUrl) {
        console.log(`Rewrite ${url} to ${newUrl}`);
      }
      return yield* next(newUrl, init);
    },
  });
}
